# Z0025E Module 1: Card coverage audit

Drafted 2026-10-04 (Claude) against the Module 1 overview (1.1), the two lecture items (1.3, 1.4),
their slides (L01, L02), the six textbook-author lecture videos and End of Module 1 (1.6).
Existing cards are the Module 1 cards in `data/cards/2026-10-03-earlier-weeks.json`; new cards are
in `data/cards/2026-10-04-z0025e-m1.json`. Cards are named by prompt.

"Before" is the status with the existing cards only; "After" includes the new cards.

| Objective or focus question | Existing cards | New cards | Before | After |
|---|---|---|---|---|
| LO: describe the Internet at a high level and identify its main components | none | What are the main components that make internet communication possible? | not | full |
| LO: explain the basic role of network protocols | none | What is a network protocol, and what does it define? | not | full |
| LO: distinguish between the network edge and the network core | none | Network edge versus network core; What is an access network, and which physical media can its links use? | not | full |
| LO: describe the basic difference between packet switching and circuit switching | Packet switching versus circuit switching | Why can packet switching serve more users than circuit switching on the same link? | partly (difference only, no reason why the internet chose packets; cites 1.3) | full |
| LO: identify delay, loss and throughput as important aspects of network performance | Four kinds of delay; Two-link throughput (10 then 2 Mbit/s) | What factors can affect the performance that a network application experiences?; How do queuing delay and packet loss happen in a router?; Store-and-forward; Traceroute | partly (loss not covered) | full |
| LO: recognise why security is an important consideration in computer networks | none | Why does communicating over a network introduce security challenges?; Packet sniffing, IP spoofing and denial of service | not | full |
| LO: describe why network communication is organised into protocol layers | Five layers with examples; What is encapsulation? | Why is network communication organised into layers? | partly (names and encapsulation, not the reason for layering) | full |
| Course outcome: describe the purpose of the Internet protocol stack | Five layers with examples; What is encapsulation? | Why layers; Transport layer versus network layer; Which layers do hosts, routers and switches implement? | partly | full |
| Course outcome: difference between packet- and circuit-switching technologies | Packet switching versus circuit switching | Why can packet switching serve more users | partly | full |
| Focus: what are the main components that make Internet communication possible? | none | What are the main components...; What is a network protocol...? | not | full |
| Focus: what is the difference between the network edge and the network core? | none | Network edge versus network core; Access network and physical media | not | full |
| Focus: at a high level, how does data get from one end system to another? | Packet switching versus circuit switching (partly) | At a high level, how does data get from one end system to another?; Store-and-forward | partly | full |
| Focus: what factors can affect the performance experienced by a network application? | Four kinds of delay; Two-link throughput | What factors can affect the performance...; Queuing delay and packet loss; Traceroute | partly | full |
| Focus: why is network communication organised into layers? | Five layers with examples (names only) | Why is network communication organised into layers? | partly | full |
| Focus: why does communicating over a network introduce security challenges? | none | Why does communicating over a network introduce security challenges?; Sniffing, spoofing, DoS | not | full |
| Before the quiz: recognise the major components and concepts and how they relate (big picture) | the five existing cards, each on one concept | the end-to-end journey card and the performance card tie the concepts together; the layers-per-device card links layers to the edge and core | partly | full |
| End of Module 1 self-check (1.6): how an end system connects, how packets move, what affects performance, why layers | partly, as above | Access network; End-to-end journey; Performance factors; Why layers | partly | full |

## Corrections to existing cards

- **Packet switching versus circuit switching** (sources `1.3`): packet and circuit switching are
  taught in Lecture 2, item 1.4 (L02 slides on the network core, and the Network Core video), not in
  1.3. Suggested sources: `1.4`, `1.1` (it answers a learning objective). The content is right; it
  could add that a circuit gives guaranteed performance (no queuing) and that packet switching needs
  no call setup.
- **What four kinds of delay does a packet meet at each router on its way?** (`1.4`): correct. The
  slides list a second job for processing delay: checking for bit errors. Could add `1.1`.
- **A file goes over two links, 10 Mbit/s and then 2 Mbit/s** (`1.4`): correct.
- **Name the five layers of the internet protocol stack** (`1.3`): correct; could add `1.1`, since
  the Study Guide names the five layers.
- **What is encapsulation?** (`1.3`): "TCP adds a header" is narrower than the slides, which say the
  transport-layer protocol adds the header `Ht` (TCP or UDP). Suggested wording: "the transport
  layer (e.g. TCP) adds a header".
- **What is the difference between forwarding and routing in the network layer?** (`4.2`, in
  `2026-10-03-ip-and-patterns.json`): Module 1 already teaches this (L02 "Two key network-core
  functions" and a Check Your Understanding question in 1.4). It could also cite `1.4`. No new card
  was written for it, to avoid a duplicate; the end-to-end journey card mentions both terms.

## Notes

- **Slide slip, L01 encapsulation slide (link layer):** it says the link-layer protocol works "using
  network-layer services". In the stack the link layer uses the physical layer's service; the new
  cards follow the stack and do not repeat that phrase.
- **Slide typo, L02 traceroute slide:** "TLL" for TTL (time-to-live). The traceroute card uses TTL.
- **Processing delay size:** the slide says typically under a microsecond ("< microsecs"), the video
  says microseconds or less. No card states a number.
- **Statistical multiplexing number:** the video gives the chance that more than 10 of 35 users are
  active as about 0.0004; the slide only says it is typically low and depends on the traffic. The
  card follows the slide and gives no number.
- **Overview versus material:** the 1.1 overview says Lecture 2 introduces protocol layering, but
  layering is in Lecture 1 (1.3, L01 slides and the layers video). The layer cards cite `1.3`.
- **1.3 Check Your Understanding, transmission-rate question:** the explanation labels a wrong option
  "C" (the correct answer is C, the wrong one meant is D) and calls `L/R` a "transmission rate"; it
  is the transmission delay. The cards use transmission delay.
- **Not covered by cards on purpose:** Internet structure (tier-1 ISPs, IXPs, content provider
  networks) and FDM/TDM in circuit switching are in the L02 slides or video but not in the objectives
  or focus questions; the per-connection throughput with a shared backbone link (`min(Rs, Rc, R/10)`)
  extends the existing two-link card and is left to the practice problems. The course introduction
  (1.2, L00 slides) is about course logistics, not concepts.
- **Not readable:** several files linked from 1.2 and 1.3 returned 404 from Canvas (see the module
  index), and the Knowledge Checks and Problems are external links not downloaded. The graded Module
  Quiz (1.5) was not used. (Since downloaded: see Textbook exercises below.)

## Textbook exercises

Hint cards drafted 2026-10-04 (Claude) in `data/cards/2026-10-04-z0025e-m1-exercises.json`, from the
cached Knowledge Checks and interactive problems (Kurose and Ross, 8th edition site) that items 1.3
and 1.4 link to. They say how to approach each kind of question, not the answers; worked examples
use made-up numbers. "Earlier cards" are the concept cards the hints point to.

| Exercise | Linked from | Hint cards | Earlier cards |
|---|---|---|---|
| Knowledge Check: What is the Internet? (3 questions) | 1.3 | ...the two views of the Internet and about what counts as a protocol? | Main components; Network protocol |
| Knowledge Check: The Network Edge (2) | 1.3 | ...access network speeds and physical media? | Access network and physical media |
| Knowledge Check: Protocol Layers and Their Service Models (4) | 1.3 | ...what each layer does and what its unit of data is called?; ...protocol headers and encapsulation? | Five layers; Encapsulation; Transport versus network layer |
| Knowledge Check: The Network Core (7) | 1.4 | ...routing versus forwarding and packet versus circuit switching?; ...counting calls and choosing circuit or packet switching?; ...the network of networks and the traceroute exercise? | Forwarding and routing (4.2); Packet versus circuit switching; Why packet switching serves more users; Traceroute |
| Knowledge Check: Performance (10) | 1.4 | ...delay components and computing transmission and propagation delay?; ...end-to-end throughput and link utilization? | Four kinds of delay; Two-link throughput; Store-and-forward |
| Knowledge Check: Network Under Attack (1) | 1.4 | ...security defences? | Sniffing, spoofing and denial of service |
| Interactive: Circuit Switching | 1.4 | Interactive problem, Circuit Switching: how do you solve it? | Packet versus circuit switching |
| Interactive: One-hop Transmission Delay | 1.4 | Interactive problem, One-hop Transmission Delay: how do you solve it? | Store-and-forward |
| Interactive: Queuing Delay | 1.4 | Interactive problem, Queuing Delay: how do you solve it? | Queuing delay and packet loss |
| Interactive: End-to-End Delay | 1.4 | Interactive problem, End-to-End Delay: how do you solve it? | Four kinds of delay; Store-and-forward |
| Interactive: End-to-End Throughput | 1.4 | Interactive problem, End-to-End Throughput: how do you solve it? | Two-link throughput |

Knowledge Check prompts start "Knowledge Check, <title>: how do you answer questions about"; the
table shows the rest.

### Notes on the exercises

- **Queuing Delay formula:** the interactive problem states the delay as `I(L/R)(1 - I)` and its
  worked solutions multiply by `(1 - I)`. Queuing theory, and the slides' curve where the delay
  grows without limit as `La/R` nears 1, need a division by `(1 - I)`. With the site's form the
  delay falls back toward 0 at full load. The hint card tells students to use the site's form to
  match its answers and says why it differs.
- **Queuing Delay, buffer questions:** the worked solution for "packets in the buffer 1 second
  later" subtracts `1000 / delay` from the arrivals, treating the queuing delay as the time to send
  one packet. This is not a model the course teaches; the card describes it only as "the site
  compares arrivals with departures in one second".
- **Link utilization** (Performance Knowledge Check, questions 8 to 10, and End-to-End Throughput)
  is not in the L02 slides or the Performance video. The hint cards define it (carried rate divided
  by capacity).
- **Propagation speed:** the exercises give 3x10^8 m/s (speed of light); the L02 slides give about
  2x10^8 m/s for signals in media. The cards say to use the value the question gives.
- **Access network speeds** (Network Edge Knowledge Check) are not on the L01 slides; they are in
  the Network Edge video, which the hint card quotes.
- **FDM and TDM** appear in the Network Core Knowledge Check (as a property of one switching
  technique); they are in the L02 slides and video, but the note above left them out of the
  concept cards. The hint card explains the two terms in one line.
- **Circuit Switching, question 4:** the worked solution refers to "question 4" where it means
  question 3, and compares with the clockwise-only limit. The conclusion also follows without the
  clockwise rule (two circuits per call against the total circuits); the card gives that check.
- **Traceroute question** (Network Core Knowledge Check): the expected router name depends on the
  network and the date; the site itself warns that its answer may be out of date.
- Exercise text was read from the git-ignored cache; the figures (link rates in the Performance
  and Network Core checks, the header figure) were not cached, so the cards do not depend on them.
