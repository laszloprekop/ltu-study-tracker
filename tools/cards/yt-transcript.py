# Prints the English captions of one YouTube video as plain text (uploaded captions first, else automatic).
#   uvx --with youtube-transcript-api python tools/cards/yt-transcript.py <video id>
import sys
from youtube_transcript_api import YouTubeTranscriptApi
t = YouTubeTranscriptApi().fetch(sys.argv[1], languages=["en", "en-US", "en-GB"])
print(" ".join(s.text.replace("\n", " ") for s in t))
