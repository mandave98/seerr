import { getRepository } from '@server/datasource';
import RequestComment from '@server/entity/RequestComment';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

const requestCommentRoutes = Router();

requestCommentRoutes.get<{ commentId: string }, RequestComment>(
  '/:commentId',
  isAuthenticated(
    [Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW, Permission.REQUEST],
    { type: 'or' }
  ),
  async (req, res, next) => {
    const requestCommentRepository = getRepository(RequestComment);

    try {
      const comment = await requestCommentRepository.findOneOrFail({
        where: { id: Number(req.params.commentId) },
        relations: { request: { requestedBy: true } },
      });

      if (
        !req.user?.hasPermission(
          [Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW],
          { type: 'or' }
        ) &&
        comment.user.id !== req.user?.id &&
        comment.request.requestedBy.id !== req.user?.id
      ) {
        return next({
          status: 403,
          message: 'You do not have permission to view this comment.',
        });
      }

      return res.status(200).json(comment);
    } catch (e) {
      logger.debug('Request for unknown request comment failed', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Request comment not found.' });
    }
  }
);

requestCommentRoutes.put<
  { commentId: string },
  RequestComment,
  { message: string }
>(
  '/:commentId',
  isAuthenticated([Permission.MANAGE_REQUESTS, Permission.REQUEST], {
    type: 'or',
  }),
  async (req, res, next) => {
    const requestCommentRepository = getRepository(RequestComment);

    try {
      const comment = await requestCommentRepository.findOneOrFail({
        where: { id: Number(req.params.commentId) },
      });

      if (comment.user.id !== req.user?.id) {
        return next({
          status: 403,
          message: 'You can only edit your own comments.',
        });
      }

      comment.message = req.body.message;

      await requestCommentRepository.save(comment);

      return res.status(200).json(comment);
    } catch (e) {
      logger.debug('Put request for request comment failed', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Request comment not found.' });
    }
  }
);

requestCommentRoutes.delete<{ commentId: string }, RequestComment>(
  '/:commentId',
  isAuthenticated([Permission.MANAGE_REQUESTS, Permission.REQUEST], {
    type: 'or',
  }),
  async (req, res, next) => {
    const requestCommentRepository = getRepository(RequestComment);

    try {
      const comment = await requestCommentRepository.findOneOrFail({
        where: { id: Number(req.params.commentId) },
      });

      if (
        !req.user?.hasPermission(Permission.MANAGE_REQUESTS) &&
        comment.user.id !== req.user?.id
      ) {
        return next({
          status: 403,
          message: 'You do not have permission to delete this comment.',
        });
      }

      await requestCommentRepository.remove(comment);

      return res.status(204).send();
    } catch (e) {
      logger.debug('Delete request for request comment failed', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Request comment not found.' });
    }
  }
);

export default requestCommentRoutes;
