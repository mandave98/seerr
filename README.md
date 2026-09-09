<p align="center">
<img src="./public/logo_full.svg" alt="Seerr" style="margin: 20px 0;">
</p>
<p align="center">
<img src="https://github.com/seerr-team/seerr/actions/workflows/release.yml/badge.svg" alt="Seerr Release" />
<img src="https://github.com/seerr-team/seerr/actions/workflows/ci.yml/badge.svg" alt="Seerr CI">
</p>
<p align="center">
<a href="https://discord.gg/seerr"><img src="https://img.shields.io/discord/783137440809746482" alt="Discord"></a>
<a href="https://hub.docker.com/r/seerr/seerr"><img src="https://img.shields.io/docker/pulls/seerr/seerr" alt="Docker pulls"></a>
<a href="https://translate.seerr.dev/engage/seerr/"><img src="https://translate.seerr.dev/widget/seerr/svg-badge.svg" alt="Translation status" /></a>
<a href="https://github.com/seerr-team/seerr/blob/develop/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/seerr-team/seerr"></a>

## About This Fork

> [!WARNING]
> This is a personal fork of [seerr-team/seerr](https://github.com/seerr-team/seerr) maintained for our own deployment. It is **not supported for public use**: use it at your own risk, expect it to break, and do not report problems with this fork to the Seerr maintainers or in Seerr's Discord or issue tracker.

There are three changes on top of upstream.

**Plex sign-in for additional Plex servers.** Under **Settings → Users**, the **Additional Plex Servers** field takes a comma-separated list of Plex machine identifiers. Plex accounts with access to any of those servers can sign in, and the existing **Enable Plex Sign-In** and **Enable New Plex Sign-In** settings apply to them exactly as they do for the primary server. A server's machine identifier is shown by opening `http://<server-address>:32400/identity` in a browser.

Nothing else is multi-server. Library scanning, availability, watchlists, and user import still use the single configured Plex server.

**Bulk edit only writes the permissions you change.** Under **Users → Bulk Edit**, permissions that every selected user has start checked, permissions that only some of them have show a dash, and anything you leave alone keeps each user's current value when you save. Clicking a dashed permission grants it to everyone; clicking it again revokes it from everyone. The owner and admins are never bulk edited, so their rows cannot be selected. `PUT /api/v1/user` accepts an optional `preservePermissions` bitmask for this; without it the endpoint overwrites all permissions, as upstream does.

**Per-request Sonarr search options.** Users with the **Manage Requests** permission get two toggles in the **Advanced** section of the series request modal: **Start Search for Missing Episodes** and **Start Search for Cutoff Unmet Episodes**. Both default to on. Turn them off before clicking **Approve Request** on a pending request, or when requesting as a manager, and Sonarr will add and monitor the series without searching, so a large series can be grabbed by hand. A Sonarr server's **Prevent Search** setting still disables searching regardless of the toggles, and the one-click approve buttons keep the defaults. `POST` and `PUT /api/v1/request` accept `searchForMissingEpisodes` and `searchForCutoffUnmetEpisodes` for this.

- **Docker image:** `ghcr.io/mandave98/seerr` (`latest` and `sha-*` tags), built automatically from the `fork` branch by the [Fork Docker Image](.github/workflows/fork-docker.yml) workflow.
- **Branches:** `fork` is upstream `develop` plus our commits and is what we ship. `develop` is left as a pristine copy of upstream. To pick up upstream changes, rebase `fork` onto `upstream/develop` and force-push.

---

**Seerr** is a free and open source software application for managing requests for your media library. It integrates with the media server of your choice: [Jellyfin](https://jellyfin.org), [Plex](https://plex.tv), and [Emby](https://emby.media/). In addition, it integrates with your existing services, such as **[Sonarr](https://sonarr.tv/)**, **[Radarr](https://radarr.video/)**.

## Current Features

- Full Jellyfin/Emby/Plex integration including authentication with user import & management.
- Support for **PostgreSQL** and **SQLite** databases.
- Supports Movies, Shows and Mixed Libraries.
- Ability to change email addresses for SMTP purposes.
- Easy integration with your existing services. Currently, Seerr supports Sonarr and Radarr. More to come!
- Jellyfin/Emby/Plex library scan, to keep track of the titles which are already available.
- Customizable request system, which allows users to request individual seasons or movies in a friendly, easy-to-use interface.
- Incredibly simple request management UI. Don't dig through the app to simply approve recent requests!
- Granular permission system.
- Support for various notification agents.
- Mobile-friendly design, for when you need to approve requests on the go!
- Support for watchlisting & blocklisting media.

With more features on the way! Check out our [issue tracker](/../../issues) to see the features which have already been requested.

## Getting Started

Check out our documentation for instructions on how to install and run Seerr:

https://docs.seerr.dev/getting-started/

## Preview

<img src="./public/preview.jpg" alt="Seerr application preview" />

## Migrating from Overseerr/Jellyseerr to Seerr

Read our [release announcement](https://docs.seerr.dev/blog/seerr-release) to learn what Seerr means for Jellyseerr and Overseerr users.

Please follow our [migration guide](https://docs.seerr.dev/migration-guide) for detailed instructions on migrating from Overseerr or Jellyseerr.

## Support

- Check out the [Seerr Documentation](https://docs.seerr.dev) before asking for help. Your question might already be in the docs!
- You can get support on [Discord](https://discord.gg/seerr).
- You can ask questions in the Help category of our [GitHub Discussions](/../../discussions).
- Bug reports and feature requests can be submitted via [GitHub Issues](/../../issues).

## API Documentation

You can access the API documentation from your local Seerr install at http://localhost:5055/api-docs

## Community

You can ask questions, share ideas, and more in [GitHub Discussions](/../../discussions).

If you would like to chat with other members of our growing community, [join the Seerr Discord server](https://discord.gg/seerr)!

Our [Code of Conduct](./CODE_OF_CONDUCT.md) applies to all Seerr community channels.

## Contributing

You can help improve Seerr too! Check out our [Contribution Guide](./CONTRIBUTING.md) to get started.

## Contributors ✨

[![Contributors](https://opencollective.com/seerr/contributors.svg?width=890)](https://opencollective.com/seerr/#backers)

[![Become a Backer](https://opencollective.com/seerr/backers.svg)](https://opencollective.com/seerr/#backers)
[![Become a Sponsor](https://opencollective.com/seerr/sponsors.svg)](https://opencollective.com/seerr/#sponsors)
