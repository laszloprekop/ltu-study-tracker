# Z0025E Module 7 (Wireless and Mobile Networks): Card coverage audit

Drafted 2026-10-07 (Claude) from the Module 7 overview (7.1), the Lecture 14 page (7.2) with its Check Your
Understanding questions, the L14 slides, and the four Knowledge Checks and four interactive problems the lecture
page links. The lecture has no recording or captions in the cached material. No cards existed for this module; the
new cards are in `data/cards/2026-10-07-z0025e-m7.json` (43 cards, all with source `7.2`, 26 of them also `7.1`).
Cards are named by prompt.

Status is the coverage after the new cards: full, partly or not.

## Coverage

| Objective or focus question | New cards | Status after |
|---|---|---|
| LO: identify the main components of a wireless network | Which three elements make up a wireless network, next to the wired network infrastructure?; Infrastructure mode versus ad hoc mode in a wireless network: what is the difference?; Which four classes of wireless network follow from single or multiple hops, with or without infrastructure? | full |
| LO: how wireless links differ from wired links; effects of signal attenuation, interference and multipath propagation | Which three properties make a wireless link harder to use than a wired link?; What are SNR and BER on a wireless link, and how do they depend on each other?; What is rate adaptation in 802.11, and when does a device switch to a lower rate? | full |
| Focus: why can't a wireless link be treated like an Ethernet cable without the cable? | Which three properties make a wireless link harder to use than a wired link?; What is the hidden terminal problem in a wireless network?; Why does 802.11 use collision avoidance (CSMA/CA) and not collision detection (CSMA/CD)? | full |
| LO: why multiple access presents particular challenges in wireless networks | What is the hidden terminal problem in a wireless network?; Why does 802.11 use collision avoidance (CSMA/CA) and not collision detection (CSMA/CD)?; What is CDMA, and how can several users send at the same time on the same frequency? | full |
| Focus: how can multiple wireless devices share the same channel when they cannot reliably detect every competing transmission? | Which steps do an 802.11 sender and receiver follow in CSMA/CA?; What do RTS and CTS frames do in 802.11?; Why does 802.11 use collision avoidance (CSMA/CA) and not collision detection (CSMA/CD)? | full |
| LO: basic architecture and operation of an IEEE 802.11 wireless LAN | What is a Basic Service Set (BSS) in an 802.11 wireless LAN?; Which steps do an 802.11 sender and receiver follow in CSMA/CA?; Which MAC addresses do address 1, 2 and 3 of an 802.11 frame hold?; A host moves between two access points in the same IP subnet. What changes, and what stays?; How does 802.11 power management let a node sleep without losing frames? | full |
| LO: how Wi-Fi devices associate with and communicate through an access point | Which steps does an arriving host take to join an 802.11 network?; Passive versus active scanning in 802.11: how does a host find an access point?; Which MAC addresses do address 1, 2 and 3 of an 802.11 frame hold? | full |
| Study guide: differences between wireless and switched Ethernet communication | Why does 802.11 use collision avoidance (CSMA/CA) and not collision detection (CSMA/CD)?; Which MAC addresses do address 1, 2 and 3 of an 802.11 frame hold? | full |
| LO: basic architecture of cellular networks | 4G/5G cellular networks versus the wired Internet: what is similar and what is different?; Which elements does the 4G LTE architecture have, and which belong to the radio access network?; Control plane versus data plane in LTE: which elements belong to each?; How are the cellular networks of different carriers connected to each other? | full for 4G, partly for 5G (see Notes) |
| LO: roles of major components in 4G and 5G networks | What does a 4G base station (eNode-B) do, and how does it differ from a WiFi access point?; What does the Home Subscriber Service (HSS) do in a 4G network?; Serving Gateway (S-GW) versus PDN Gateway (P-GW) in 4G LTE: what does each do?; What does the Mobility Management Entity (MME) do in a 4G network?; What is the IMSI in a 4G LTE network? | full for 4G, not for 5G components (see Notes) |
| Focus: how does a cellular network connect a mobile device to the wider Internet? | Which elements does the 4G LTE architecture have, and which belong to the radio access network?; How does a mobile device associate with a base station in LTE?; What does a datagram look like inside a 4G tunnel between base station, S-GW and P-GW?; Serving Gateway (S-GW) versus PDN Gateway (P-GW) in 4G LTE: what does each do? | full |
| LO: the fundamental challenge of maintaining communication when a device changes its point of attachment | Wireless versus mobility: which two different challenges does Module 7 separate?; Which kinds of mobility exist from the network's point of view, and which are the hard ones? | full |
| LO: basic principles of mobility management | Why is mobility not simply left to the routers and their routing tables?; Home network versus visited network: what does each mean for a mobile device?; What is registration in mobility management, and what is the result?; Indirect versus direct routing to a mobile: what are the trade-offs? | full |
| Focus: if a device moves to another network, how can packets still find it? | What is registration in mobility management, and what is the result?; How does a datagram reach a mobile in a visited network with indirect routing?; How does a datagram reach a mobile in a visited network with direct routing? | full |
| LO: how mobility is supported in cellular networks and Mobile IP | Which four major mobility tasks does a 4G network carry out for a roaming mobile?; 4G handover, steps 1 to 4: what happens until the mobile can use the new base station?; 4G handover, steps 5 to 7: what does the network do after the mobile has switched base station?; What is Mobile IP, and how do its agents compare with the 4G elements? | full |
| LO: how wireless communication and mobility can affect higher-layer protocol performance | How do wireless links and mobility affect TCP and other higher-layer protocols? | full |
| Focus: how might a transport protocol interpret packet loss caused by a wireless link or mobility? | How do wireless links and mobility affect TCP and other higher-layer protocols? | full |
| Before the quiz: why wireless networking presents different challenges from wired networking | Wireless versus mobility: which two different challenges does Module 7 separate?; Which three properties make a wireless link harder to use than a wired link?; What is the hidden terminal problem in a wireless network? | full |
| Before the quiz: how Wi-Fi and cellular networks address those challenges | the CSMA/CA, RTS and CTS, rate adaptation and CDMA cards; the 4G architecture cards | full |
| Before the quiz: which additional mechanisms are needed when devices move between networks | the registration, indirect routing, direct routing, 4G mobility tasks and handover cards | full |
| Lecture page, Learning focus: keep wireless and mobility apart (also a Check Your Understanding question) | Wireless versus mobility: which two different challenges does Module 7 separate? | full |
| Lecture topic beyond the objectives: transmission rates and ranges of wireless links (Knowledge Check "How fast is that wireless technology?") | Roughly which transmission rates do Bluetooth, the 802.11 versions, 4G LTE and 5G reach? | full |
| Lecture topic beyond the objectives: CDMA encoding and decoding (two interactive problems) | How does CDMA encode a data bit and decode it again? | full |
| Lecture topic beyond the objectives: 802.11 mobility within a subnet, rate adaptation, power management | A host moves between two access points in the same IP subnet. What changes, and what stays?; What is rate adaptation in 802.11, and when does a device switch to a lower rate?; How does 802.11 power management let a node sleep without losing frames? | full |

## Notes

- **No recording.** Module 7 has one lecture and the cached material holds no transcript or video captions for it.
  Every card rests on the L14 slides, the lecture page and the linked exercises. The slides say "if not in this
  slide pack, not to be examined", so the cards stay inside the slide pack.
- **5G.** The objectives name "4G and 5G", but the slides describe only the 4G LTE elements. 5G appears as a name
  in titles and as one rate (10 Gbps) in the chart of wireless links. No card describes a 5G component, because no
  material does. If a later item teaches the 5G core, add cards for it.
- **Bluetooth.** One Knowledge Check question asks about Bluetooth (piconet controller, TDM, FDM, polling), and one
  compares the power use, capacity and range of WiFi, 4G LTE and Bluetooth. The slides give Bluetooth only a rate and
  a place in the taxonomy, so there is no Bluetooth card. The same holds for the Knowledge Check on sleep modes in
  4G and on link-layer reliable data transfer in 4G: the slides teach power management only for 802.11.
- **BER.** The slide spells BER out as "Bit Rate Error"; the lecture page and the End of Module page say Bit Error
  Rate. The cards use bit error rate.
- **Figures read from the extracted text.** The slide text does not carry the pictures. Three cards lean on what
  the figures show: the rate adaptation card (the SNR and BER curves of BPSK, QAM16 and QAM256, with the rates
  1, 4 and 8 Mbps taken from the slide text; the statement that a faster modulation needs a higher SNR for the same
  BER is what the curves show), the rates card (the chart's rate labels are in the text, but which technology sits
  in which range class is not, so the card lists the four range classes without assigning technologies to them),
  and the mobility spectrum card (the text does not show which columns "We're interested in these!" points at, so
  the card does not say).
- **4G LTE rate.** The slide chart places 4G LTE without a number of its own; "hundreds of Mbps" is from the
  answer list of the Knowledge Check "How fast is that wireless technology?".
- **Hidden terminal and fading.** The slide gives two pictures with the same three statements (A and B hear each
  other, B and C hear each other, A and C do not). The card keeps both under one idea and does not say what hides
  A from C, since the slide text does not.
- **RTS, CTS and hidden terminals.** The slides say the CTS is heard by all nodes and the other stations defer; the
  link to the hidden terminal problem is made by the Knowledge Check "RTS/CTS frames" and the lecture page. The card
  states it in one short line.
- **Why link-layer ACKs.** The slides give one reason (the hidden terminal problem). The Knowledge Check "Use of
  ACKs in WiFi" asks for two; the second (noisy links make bit errors more likely) is not on the slides, and the
  cached text does not mark the correct options, so the CSMA/CA card gives only the slide's reason.
- **Decoding formula.** The slide writes the CDMA decoding sum without the division by M, but its worked example
  divides by 8, the code length. The card says "add them all, divide by M".
- **4G tunneling.** The slides say only that tunneling is used extensively and that the MME sets the tunnels up. What
  a tunnelled datagram looks like (the original datagram inside an outer one carried over UDP, the plain datagram
  on the radio hop and after the P-GW, the server unaware) is taken from the interactive problem "4G Wireless
  Tunneling". The card uses none of the problem's addresses or port numbers.
- **Handover in two cards.** The slides give seven steps; a card holds at most five list lines, so the handover is
  split at the point where it "looks complete to the mobile" (steps 1 to 4, then 5 to 7).
- **Terms.** The slides call the same element "Home Subscriber Service" (architecture slides, lecture page quiz) and
  "Home Subscriber Server" (network of networks slide, Knowledge Check). The cards say Home Subscriber Service (HSS).
  "Foreign address", "care-of-address" and "COA" are the slide's three names for one thing; the direct routing card
  names all three once. "Handoff" (wireless elements slide) and "handover" (4G slides) are both kept where the
  slides use them.
- **Earlier modules.** No idea from the Module 1 to 4 cards is repeated. The tunnelling card is about 4G tunnels,
  not the IPv4 and IPv6 tunnelling card of Module 4; the higher-layer card builds on the TCP congestion control
  cards of Module 3 without restating them. CSMA/CD and switch self-learning belong to Module 6 and are only named.
- **Quiz content.** No card reproduces a Module 7 Quiz question. The Check Your Understanding questions, Knowledge
  Checks and interactive problems were used to see which ideas the lecture stresses; no hint cards for the
  exercises were drafted in this pass.
