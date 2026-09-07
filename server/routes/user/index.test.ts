import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import { checkUser, isAuthenticated } from '@server/middleware/auth';
import authRoutes from '@server/routes/auth';
import { setupTestDb } from '@server/test/db';
import type { Express } from 'express';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import userRoutes from '.';

let app: Express;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(checkUser);
  app.use('/auth', authRoutes);
  app.use('/user', isAuthenticated(), userRoutes);
  app.use(
    (
      err: { status?: number; message?: string },
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction
    ) => {
      res
        .status(err.status ?? 500)
        .json({ status: err.status ?? 500, message: err.message });
    }
  );
  return app;
}

before(async () => {
  app = createApp();
});

setupTestDb();

async function loginAsOwner() {
  getSettings().main.localLogin = true;

  const agent = request.agent(app);
  const res = await agent
    .post('/auth/local')
    .send({ email: 'admin@seerr.dev', password: 'test1234' });

  assert.strictEqual(res.status, 200);
  return agent;
}

async function createUser(email: string, permissions: number) {
  const user = new User();
  user.email = email;
  user.avatar = '';
  user.permissions = permissions;
  await getRepository(User).save(user);
  return user.id;
}

async function permissionsOf(id: number) {
  const user = await getRepository(User).findOneOrFail({ where: { id } });
  return user.permissions;
}

describe('PUT /user', () => {
  it('only writes the permissions that are not preserved', async () => {
    const agent = await loginAsOwner();
    const a = await createUser(
      'a@seerr.dev',
      Permission.REQUEST | Permission.REQUEST_4K
    );
    const b = await createUser('b@seerr.dev', Permission.REQUEST);

    // Grant Auto-Approve to both while leaving the mixed Request 4K bit alone
    const res = await agent.put('/user').send({
      ids: [a, b],
      permissions: Permission.REQUEST | Permission.AUTO_APPROVE,
      preservePermissions: Permission.REQUEST_4K,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(
      await permissionsOf(a),
      Permission.REQUEST | Permission.REQUEST_4K | Permission.AUTO_APPROVE
    );
    assert.strictEqual(
      await permissionsOf(b),
      Permission.REQUEST | Permission.AUTO_APPROVE
    );
  });

  it('overwrites all permissions when preservePermissions is omitted', async () => {
    const agent = await loginAsOwner();
    const a = await createUser(
      'a@seerr.dev',
      Permission.REQUEST | Permission.REQUEST_4K
    );

    const res = await agent
      .put('/user')
      .send({ ids: [a], permissions: Permission.AUTO_APPROVE });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(await permissionsOf(a), Permission.AUTO_APPROVE);
  });

  it('never modifies the owner or other admins', async () => {
    const agent = await loginAsOwner();
    const admin = await createUser('admin2@seerr.dev', Permission.ADMIN);
    const regular = await createUser('regular@seerr.dev', Permission.REQUEST);

    const res = await agent.put('/user').send({
      ids: [1, admin, regular],
      permissions: Permission.REQUEST | Permission.AUTO_APPROVE,
    });

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(
      res.body.map((user: User) => user.id),
      [regular]
    );
    assert.strictEqual(await permissionsOf(1), Permission.ADMIN);
    assert.strictEqual(await permissionsOf(admin), Permission.ADMIN);
    assert.strictEqual(
      await permissionsOf(regular),
      Permission.REQUEST | Permission.AUTO_APPROVE
    );
  });
});
