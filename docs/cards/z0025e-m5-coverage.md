# Z0025E Module 5 (Network Layer: Control Plane): Card coverage audit

Drafted 2026-10-07 (Claude) from the Module 5 overview (5.1), the lecture pages 5.2 (Lecture 10), 5.3 (Lecture 11)
and 5.4 (Lecture 12), the L10, L11 and L12 slides and the textbook author's lecture video captions. No cards existed
for this module; the new cards are in `data/cards/2026-10-07-z0025e-m5.json` (48 cards: 17 on 5.2, 20 on 5.3, 11 on
5.4; 26 of them also name 5.1 because they answer a learning objective or focus question). Cards are named by prompt.

Status is the coverage with the new cards: full, partly or not.

## Coverage

| Objective or focus question | New cards | Status after |
|---|---|---|
| LO: role of the Network Layer control plane and its relationship to the data plane | Per-router control plane versus SDN control plane: where are the forwarding tables computed? (the Module 4 card, source 4.2); What is the goal of a routing protocol, and what does a "good" path mean? | full |
| Focus: where does the forwarding information used by a router's data plane come from? | Per-router control plane versus SDN control plane: where are the forwarding tables computed? (the Module 4 card, source 4.2); How does a router get its forwarding table from the result of Dijkstra's algorithm? | full |
| LO: distinguish between routing and forwarding | none new: already carded in Module 4 ("What is the difference between forwarding and routing in the network layer?", source 4.2). The per-router versus SDN card builds on it. | full (by the Module 4 card) |
| LO: principles of link-state and distance-vector routing | Routing algorithms: what do global versus decentralized and static versus dynamic mean?; What does link-state routing need before a router can compute its routes, and what does it produce?; How does a node run the distance-vector algorithm, step by step?; How is a network modelled as a graph for routing, and who decides the link costs? | full |
| LO: apply Dijkstra's algorithm to determine least-cost paths | In Dijkstra's algorithm, what do D(v), p(v) and N' stand for?; Which steps does Dijkstra's algorithm repeat to find the least-cost paths from a source u?; How does a router get its forwarding table from the result of Dijkstra's algorithm? | full (the method; practice needs the interactive problems) |
| Focus: how can a router determine the least-cost path when it knows the complete network topology? | the three Dijkstra cards above; What does link-state routing need before a router can compute its routes, and what does it produce? | full |
| LO: apply the Bellman-Ford distance-vector approach and explain how routing information changes | What does the Bellman-Ford equation say about the least cost from node x to node y?; How does a node run the distance-vector algorithm, step by step?; How fast does routing information spread through a network in distance-vector routing?; What is the count-to-infinity problem in distance-vector routing? | full (the method; practice needs the interactive problem) |
| Focus: how can routers discover least-cost paths using only information exchanged with their neighbours? | What does the Bellman-Ford equation say about the least cost from node x to node y?; How does a node run the distance-vector algorithm, step by step? | full |
| LO: compare the characteristics of link-state and distance-vector routing | Link-state versus distance-vector routing: what does each router know, and how does it compute?; Link-state versus distance-vector: how do they compare in message complexity and convergence?; Link-state versus distance-vector: what happens when a router malfunctions or is compromised?; What does Dijkstra's link-state algorithm cost in computation and in messages for n nodes?; Why can routes oscillate in link-state routing? | full |
| LO: why Internet routing is organised into Autonomous Systems | Why is Internet routing organised into Autonomous Systems (ASes)?; Intra-AS versus inter-AS routing: which routers take part, and which entries does each fill? | full |
| Focus: why does the Internet require different approaches for routing within and between Autonomous Systems? | OSPF versus BGP: why does the Internet route differently inside an AS and between ASes?; Why is Internet routing organised into Autonomous Systems (ASes)? | full |
| LO: basic operation and purpose of OSPF | How does OSPF compute routes inside an Autonomous System?; How does hierarchical OSPF keep link-state routing scalable in a large AS?; Which intra-AS routing protocols does the lecture name, and what kind is each? | full |
| LO: basic operation and purpose of BGP | eBGP versus iBGP: what does each do?; What is a BGP session, and what does an AS promise when it advertises a path?; What is in a BGP route advertisement, and what do AS-PATH and NEXT-HOP mean?; How does an AS enforce routing policy in BGP?; In which order does a BGP router choose among several routes to the same destination?; What is hot potato routing?; How does a router inside an AS get a forwarding table entry for a prefix outside the AS? | full |
| LO: principles of a logically centralised SDN control plane and the role of OpenFlow | How does an SDN control plane differ from traditional per-router control?; Why is a logically centralized control plane attractive, according to the lecture?; Which three layers make up an SDN architecture, and which APIs connect them?; Which three layers does an SDN controller have inside?; What is the OpenFlow protocol, and which three classes of messages does it have?; Which key OpenFlow messages go from controller to switch, and which from switch to controller?; In SDN, what happens between switch, controller and routing application when a link fails? | full |
| Focus: how does an SDN control plane differ from traditional per-router control? | How does an SDN control plane differ from traditional per-router control?; Per-router control plane versus SDN control plane: where are the forwarding tables computed? (the Module 4 card, source 4.2) | full |
| Study guide: connect SDN to the match+action model of Module 4 | What is the OpenFlow protocol, and which three classes of messages does it have? (separates the protocol from the OpenFlow API of generalized forwarding) | partly (one line; match plus action itself belongs to Module 4) |
| LO: purpose of ICMP | What is ICMP used for, and how are ICMP messages carried?; What does an ICMP message contain, and which type and code values matter most? | full |
| Focus: how can an IP network communicate information about errors and network conditions back to an end system? | What is ICMP used for, and how are ICMP messages carried?; Which ICMP messages does traceroute rely on, and how does it know it reached the destination?; Ping versus traceroute: what does each one test, and with which ICMP messages? | full |
| LO: basic principles of network management, including SNMP and NETCONF/YANG | Which components does network management consist of?; Which three approaches can a network operator use to manage devices?; SNMP: what are request/response mode and trap mode, and which message types belong to each?; What is a MIB in SNMP?; What is NETCONF, and how does it talk to devices?; Which NETCONF operations read, change and protect a device's configuration?; What is YANG, and what is its role next to NETCONF? | full |
| Focus: how can network administrators observe and configure large numbers of network devices? | Which three approaches can a network operator use to manage devices?; What is NETCONF, and how does it talk to devices? | full |
| Before the quiz: explain the control-plane concepts and apply the routing algorithms (practise Dijkstra and Bellman-Ford) | the Dijkstra and Bellman-Ford cards above | partly (cards give the method and the notation; the practice itself is the three interactive problems) |
| Before the quiz: why OSPF and BGP serve different routing purposes | OSPF versus BGP: why does the Internet route differently inside an AS and between ASes? | full |
| Before the quiz: how an SDN control plane differs from traditional routing | How does an SDN control plane differ from traditional per-router control? | full |
| 5.2 "check that you can explain": why Dijkstra and Bellman-Ford reach the same least-cost routes with very different information | Link-state versus distance-vector routing: what does each router know, and how does it compute? | full |
| 5.4 discussion: how traceroute uses an error condition, against ping's direct check | Ping versus traceroute: what does each one test, and with which ICMP messages?; Which ICMP messages does traceroute rely on, and how does it know it reached the destination? | full (the concept; the cards do not write the discussion answer) |

## Notes

- **Routing versus forwarding.** Not carded again: the Module 4 card (source 4.2) already gives forwarding as the
  data plane and routing as the control plane. Consider adding `5.1` or `5.2` to that card's sources, since the
  Module 5 objective and the first Knowledge Check ask for exactly this.
- **Traceroute and TTL.** Two earlier cards exist: "How does traceroute measure the delay to each router on a path?"
  (1.4) and "What is the TTL field in the IPv4 header for?" (4.2). The Module 5 traceroute card covers only what is
  new here: the ICMP message types, the port unreachable message that ends the trace, and that routers may but need
  not answer. It does not repeat the three probes or the RTT reading.
- **Link cost and congestion.** The L10 slide on the graph abstraction says a cost could be "inversely related to
  congestion". The lecture page (Check Your Understanding) and the video captions say the opposite: higher
  congestion, higher cost. The card follows the page and the captions.
- **Count-to-infinity fixes.** The slides say "see textbook for solutions" and name none (no poisoned reverse), so
  the card stops at the problem and its cause.
- **Bellman-Ford worked example.** The slide example (`Du(z) = min{2+5, 1+3, 5+3} = 4`) is partly lost in the
  slide text extraction, so the card explains the equation without the numbers.
- **Oscillation scenario.** The slide figure (traffic entering at d, c, e with costs `0`, `1`, `1+e`) is an image;
  the card describes the mechanism in words only.
- **Black-holing.** The slides only name the term. The card adds a one-clause explanation (traffic is drawn to the
  faulty router and lost).
- **BGP messages.** OPEN, UPDATE, KEEPALIVE and NOTIFICATION are in the textbook but not on the L11 slides, and the
  slide pack says what is not in it is not examined. No card.
- **SDN controller internals.** The layer contents (network graph, intent, statistics, flow tables, link-state, host
  and switch info, OpenFlow, SNMP) come from a slide figure and from the Knowledge Check "The SDN Control Plane";
  RESTful API is on the figure but left out to keep the card short. ODL and ONOS are named on the summary slide
  only, with no content, so there is no card on them.
- **SDN traffic engineering.** The three slide scenarios (re-define link weights, split traffic, route two flows
  differently) are reduced to one line in the "why centralized" card; the figures are images.
- **ICMP header detail.** The captions add a checksum field and protocol number 1; the slides give type, code and the
  first 8 bytes of the offending datagram. The card follows the slides.
- **NETCONF sample message and YANG syntax.** The sample RPC (MTU of an Ethernet interface) is an image with only
  its captions extracted, and no YANG code is shown. No card on syntax.
- **No captions for network management.** Lecture 12 has one video (ICMP). The network management cards rest on the
  L12 slides and the 5.4 page alone.
- **Dijkstra facts from the Knowledge Check.** "A node in N' stays there" and "D(v) is only ever replaced by a
  smaller value" follow from the slide pseudocode (`D(v) = min(...)`, nodes are only added to N'); the Knowledge
  Check asks about both.
- **Exercises.** No hint cards were drafted for the six Knowledge Checks and three interactive problems (cached under
  `cache/course-material/Z0025E/m5/files/`). They were used only to see which ideas the lectures stress. No card
  reproduces a Module 5 Quiz, Knowledge Check or discussion answer.
- **Length.** Every answer is at most 600 characters, so several topics are split over two or three cards (for
  example the link-state versus distance-vector comparison, and OpenFlow).
