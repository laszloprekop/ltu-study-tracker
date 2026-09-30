#!/bin/sh
# Downloads the Phosphor duotone icons the page uses into assets/icons/ (MIT, see assets/icons/LICENSE).
# The build inlines them as an SVG sprite, because the published page cannot load fonts or images from elsewhere.
# Add a name to ICONS, run this, then use it in src/template.html as ic("name").
set -e
VERSION=2.1.1
ICONS="link calendar-check download-simple tree-structure arrows-out arrows-in target sun moon desktop calendar calendar-dot list-checks text-aa minus plus pulse palette beach-ball clock info chalkboard-teacher users-three flask microphone presentation-chart exam upload-simple question chart-bar map-trifold flag-checkered book-open barbell lightbulb play-circle clipboard-text chats-circle chats video-camera megaphone books prohibit caret-down caret-right arrow-square-out arrow-line-down hourglass-medium check-circle circle-dashed gear-six"
cd "$(dirname "$0")/../assets/icons"
for n in $ICONS; do
  curl -sf -o "$n.svg" "https://cdn.jsdelivr.net/npm/@phosphor-icons/core@$VERSION/assets/duotone/$n-duotone.svg" || echo "missing: $n"
done
curl -sf -o LICENSE "https://cdn.jsdelivr.net/npm/@phosphor-icons/core@$VERSION/LICENSE"
