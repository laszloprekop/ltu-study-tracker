# Z0025E Module 6 (The Link Layer): Card coverage audit

Drafted 2026-10-07 (Claude) from the Module 6 overview (6.1), the Lecture 13 page (6.2), the L13 slides, the two
textbook author's lecture video captions (Introduction to the Link Layer; Multiple Access Links and Protocols) and
the three linked Knowledge Checks and five interactive problems. No cards existed for this module before; the new
cards are in `data/cards/2026-10-07-z0025e-m6.json` (40 cards, all citing `6.2`, 20 of them also `6.1`). Cards are
named by prompt.

Status is the coverage after the new cards: full, partly or not.

## Coverage

| Objective or focus question | New cards | Status after |
|---|---|---|
| LO: role of the Link Layer and the services it provides to the Network Layer | What is the job of the link layer, and what are nodes, links and frames?; Which services can a link-layer protocol offer?; Error detection versus error correction at the link layer: what is the difference?; On which links is link-layer reliable delivery used, and on which is it seldom used?; Where in a host is the link layer implemented? | full |
| LO: how network-layer datagrams are encapsulated into link-layer frames | What do the sending and the receiving interface do with a datagram at the link layer?; Why can one datagram be carried by several different link-layer protocols on its way? | full |
| Focus: what does the Link Layer need to do to move an IP datagram across one link? | the two cards above; What is the job of the link layer, and what are nodes, links and frames? | full |
| LO: distinguish point-to-point and shared-medium communication | Point-to-point link versus broadcast link: what is the difference? | full |
| LO: why multiple-access protocols are required on shared channels | What is a collision, and why does a shared channel need a multiple access protocol?; What would an ideal multiple access protocol do on a broadcast channel of rate R? | full |
| LO: describe and compare the basic principles of different multiple-access approaches | Which three classes of multiple access (MAC) protocols are there?; TDMA versus FDMA: how does each divide a shared channel?; How does slotted ALOHA work?; Why does slotted ALOHA retransmit with probability p, and not always in the next slot?; What is the maximum efficiency of slotted ALOHA, and where does the number come from?; What are the pros and cons of slotted ALOHA?; CSMA versus CSMA/CD: what does collision detection add?; Why can collisions still happen when nodes use carrier sensing (CSMA)?; Polling versus token passing: how does each taking turns protocol work?; Channel partitioning versus random access: how does each perform at low and at high load?; Which multiple access protocol do Ethernet, 802.11 WiFi and Bluetooth use? | full |
| Focus: how can multiple devices efficiently share the same communication channel? | Which three classes of multiple access (MAC) protocols are there?; Channel partitioning versus random access: how does each perform at low and at high load?; What does the CSMA/CD efficiency formula say, and when is the efficiency close to 1? | full |
| LO: purpose and structure of MAC addresses | What is a MAC address, and what does it look like?; IP address versus MAC address: why does an interface need both? | full |
| LO: how ARP maps between network-layer and link-layer addresses | What is ARP for, and what does an ARP table hold?; How does host A use ARP to find the MAC address of host B on the same LAN? | full |
| Focus: if a host knows the destination IP address, how does it determine which MAC address to place in the Ethernet frame? | the two ARP cards; A datagram passes a router on its way to another subnet. Which addresses change: IP or MAC? | partly (the slides walk through ARP on one LAN only; which MAC address a host uses for a destination in another subnet is not in the slide pack, see Notes) |
| LO: basic operation of Ethernet | Bus Ethernet versus switched Ethernet: how do the two topologies differ?; Why is Ethernet called connectionless and unreliable?; Which steps does the Ethernet CSMA/CD algorithm follow to send a frame?; How does Ethernet's binary (exponential) backoff choose the waiting time after a collision?; What do the many 802.3 Ethernet standards share, and in what do they differ? | full |
| Focus: what information must an Ethernet frame contain so that it can be delivered across a LAN? | What must an Ethernet frame contain so that it can be delivered across a LAN? | partly (the slide pack has no frame structure slide; see Notes) |
| LO: how an Ethernet switch forwards frames | What is an Ethernet switch, and what makes it transparent and plug-and-play?; A frame arrives at a switch interface. Which three things can the switch do with it?; Why can several hosts on an Ethernet switch transmit at the same time without collisions? | full |
| LO: how switches learn MAC-address-to-port associations | How does an Ethernet switch learn which host is reachable through which interface? | full |
| Focus: how can an Ethernet switch learn where devices are located without being manually configured? | same as above; What is an Ethernet switch, and what makes it transparent and plug-and-play? | full |
| LO: how VLANs can logically separate devices within a switched network | Which problems appear when a large switched LAN is one single broadcast domain?; What is a VLAN, and how does it change where frames go in a switched network? | partly (motivation and principle only: the slides say VLANs are not covered in the course, so there is nothing on port-based VLANs, trunking or tags) |
| Focus: how can one physical switched network behave as several logically separate LANs? | What is a VLAN, and how does it change where frames go in a switched network? | partly (same reason) |
| Before the quiz: follow an IP datagram as it is carried inside link-layer frames | What do the sending and the receiving interface do with a datagram at the link layer?; Why can one datagram be carried by several different link-layer protocols on its way?; A datagram passes a router on its way to another subnet. Which addresses change: IP or MAC? | full |
| Before the quiz: how a sender determines the appropriate MAC address | the two ARP cards | full for the same LAN |
| Before the quiz: how an Ethernet switch decides where to forward a frame | A frame arrives at a switch interface. Which three things can the switch do with it?; How does an Ethernet switch learn which host is reachable through which interface? | full |
| Before the quiz: how shared-medium access and VLANs affect communication within a local network | the multiple access cards; the two VLAN cards | full for shared-medium access, partly for VLANs |
| Lecture topic beyond the objectives: switches versus routers (comparison box on the 6.2 page, slide 52) | Switch versus router: what do they have in common, and how do they differ? | full |
| Lecture topic beyond the objectives: CSMA/CD efficiency (slide 27) | What does the CSMA/CD efficiency formula say, and when is the efficiency close to 1? | full |
| Course learning outcome: describe the purpose of the OSI Reference Model | none | not (no Module 6 material treats the OSI model) |
| Course learning outcome: present in detail major protocol representatives on the MAC layer | the Ethernet, CSMA/CD, ARP and switch cards | full for Ethernet; 802.11 and Bluetooth are only named |

## Notes

- **Error detection and correction techniques.** The slides list "error detection, correction" in the roadmap but
  have no slide on parity, checksums or CRC, and the page's book reading skips textbook section 6.2. The cards
  therefore cover only the two services (detect, or correct without retransmission) and not how a CRC is computed.
- **Ethernet frame structure.** The L13 slide pack leaves out the textbook's frame structure slide (preamble,
  addresses, type, payload, CRC). The frame card rests on what the slides do say (MAC addresses in the frame header
  identify source and destination, the frame wraps a datagram with header and trailer, error checking bits, the
  broadcast address `FF-FF-FF-FF-FF-FF`) and on the field names and descriptions in the Knowledge Check "Fields in
  an Ethernet frame". That check gives no solution in the cached text, so the card states the Type and CRC purposes
  only as far as they are certain: it does not say whether the CRC can correct errors, and it does not mention the
  preamble. A classmate with the textbook should confirm it.
- **Sending to another subnet.** The slides show ARP between two hosts on one LAN and stop there. The card on
  which addresses change at a router rests on the 6.2 page (IP addressing supports the journey across networks, MAC
  addressing supports hop-by-hop frame delivery; ARP for the next hop) and on the solution text of the interactive
  problem "Link Layer (and Network Layer) Addressing, Forwarding" (MAC addresses do not change inside a subnet and
  do change when the datagram passes a router). It gives no addresses from that problem. The step "the sender uses
  ARP for the router's interface, not for the final host" is not in the material and is not on a card.
- **VLANs.** Slide 56 says VLANs are "a big topic in itself, we don't cover it in this course". The two VLAN cards
  hold everything the slides give; the VLAN card says so in its last line.
- **Video content outside the slide pack.** Slide 2 says "if not in this slide pack, not to be examined". The
  captions also cover the cable access network (DOCSIS: FDM channels, TDMA upstream slots, random access with
  binary backoff for requests), MPLS and data center networks; none of these has a card. Three facts on cards come
  from the captions only: pure ALOHA has half the efficiency of slotted ALOHA, link-layer codes are more powerful
  than the Internet checksum, and Bluetooth and 4G LTE links retransmit frames.
- **Backoff exponent.** The slide writes the range as `{0,1,2, ..., 2m-1}` (lost superscript) for the m-th
  collision; the video says 0 to 2 to the n, minus 1. The card writes `2^m - 1`.
- **CSMA when the channel is busy.** The CSMA slide says "defer transmission" and the video says the node defers
  randomly; the Ethernet algorithm slide says the NIC waits until the channel is idle and then transmits. The CSMA
  card says "defer", the Ethernet card follows the Ethernet slide.
- **Switch table ageing.** The slides show a time stamp or TTL in each switch table entry but do not say what
  happens when it runs out. The learning card says an entry times out, which is how the Knowledge Check "Learning
  switch state removal" and "Self-learning switches" word it.
- **Slide slips.** Slide 12 lists "4G/4G" (the picture says 4G/5G; the card writes 4G/5G). Slide 51 calls the
  arrival interface "interface A" while A is also a host in the picture; the card speaks of "the interface the
  frame arrived on".
- **Speeds.** The Ethernet slide says 10 Mbps to 400 Gbps, the 802.3 standards slide lists 2 Mbps to 40 Gbps. The
  802.3 card gives both, each tied to its slide.
- **Characteristics questions.** The Knowledge Check "Multiple Access Links and Protocols" asks which protocols
  are collision-free, need central control, reach utilization near 1 or bound the waiting time. The cached text has
  no solutions. The class, load, polling and slotted ALOHA cards give the facts needed, but no card lists the
  answers protocol by protocol.
- **Quiz content.** No card reproduces a Module 6 Quiz question, and no card uses the numbers of an interactive
  problem. The Check Your Understanding questions on the 6.2 page were used to see which ideas the lecture
  stresses and to confirm three facts (MAC addresses are used only on one link, the hardware and software split,
  propagation delay as the cause of CSMA collisions).
- **Textbook exercises.** The three Knowledge Checks and five interactive problems listed in
  `cache/course-material/Z0025E/m6/index.md` have no hint cards yet (Module 3 has them in a separate file). The
  figures of the problems are images and are not cached.
