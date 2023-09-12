## 2.0
- Added support for:
  - Gitea
- Improved styling and positioning of the tooltip "✅ Copied to clipboard".
  - Gitiles: checkmark tooltip no longer moves the brackets surronding the copy
    button
  - GitHub, Bitbucket Cloud, Bitbucket Server: checkmark tooltip is now styled
    like native tooltips
- Added support for newer versions of GitWeb.
- GitHub & Bitbucket Cloud: support for on-the-fly page loads in the SPA portion
  of the websites has been improved.

## 1.3
- GitLab: bugs caused by a [recent change](https://gitlab.com/gitlab-org/gitlab/-/commit/8f8f1a82564e49d4a233e3101954af0e27ac43dc)
  in native HTML have been fixed.

## 1.1
- CGit: clicking on userscript's link caused some content to "jump around" on
  the webpage, which has been corrected.
- GitLab: compatibility with fresh release of GitLab has been improved.
- GitLab: styling of tooltip "Copied to clipboard" has been updated to make it
  look more like GitLab's native tooltips.
- Gitiles: userscript incorrectly used hash and message of the annotated tags on
  the pages for tags instead of using the hash and message of the commit which
  was annotated by the tag.  This has been fixed.
- CGit: support for `master` branch of CGit (as of 2023-08-29) has been added.

## 1.0
- The first proper release is largely the same as 0.17-alpha, with only minor
  code refactoring and cleanup comprising the difference.

## 0.17-alpha
- Bitbucket Cloud: styling has been changed for the link to be displayed as a
  button.

## 0.16-alpha
- CGit: userscript used to include extraneous content in the copied content for
  pages of commits at the tips of branches and of tagged commits, which has been
  corrected.

## 0.15-alpha
- Bitbucket Cloud: icon has been added to the link.

## 0.14-alpha
- GitHub: userscript wasn't able to be triggered after moving from a PR page to
  a commit page, which has been corrected.

## 0.13-alpha
- GitHub & Bitbucket Cloud: support for on-the-fly page loads in the SPA portion
  of the websites has been improved.

## 0.12-alpha
- The "Copied to clipboard" tooltip has been made more "honest" with regard to
  when the actual copying has taken place.

## 0.11-alpha
- Added support for:
  - Bitbucket Server

## 0.10-alpha
- A potential performance bug caused by too many `MutationObserver`s has been
  fixed.

## 0.9-alpha
- GitLab: moved the userscript's button to near GitLab's native "Copy SHA1"
  button.

## 0.8-alpha
- GitLab: userscript's button was made distinguishable from GitLab's native
  "Copy SHA1" button.

## 0.7-alpha
- Removed misleading `@match` rules.

## 0.6-alpha
- GitLab: fancy tooltip "Copy commit reference to clipboard".

## 0.5-alpha
- GitLab: tweaked copy button design.

## 0.4-alpha
- Added support for:
  - GitLab

## 0.3-alpha
- Gitiles: fixed `@match` rules for public instances.

## 0.2-alpha
- Added support for:
  - CGit

## 0.1-alpha
- Added support for:
  - Bitbucket Cloud
  - GitHub
  - GitWeb
  - Gitiles
