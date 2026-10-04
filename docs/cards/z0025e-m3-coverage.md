# Z0025E Module 3 (Transport Layer): Card coverage audit

Drafted 2026-10-04 (Claude) from the Module 3 overview (3.1), the lecture pages 3.2, 3.3 and 3.4 (Lecture 7),
the L05, L06 and L07 slides, the two Lecture 5 transcripts and the textbook author's lecture video captions.
Existing cards are the Module 3 ones in `data/cards/2026-10-03-earlier-weeks.json` (six cards); new cards are in
`data/cards/2026-10-04-z0025e-m3.json` (17 cards). Cards are named by prompt.

Status is the coverage before the new cards: full, partly or not. With the new cards every row is covered fully.

## Coverage

| Objective or focus question | Existing cards | New cards | Status before |
|---|---|---|---|
| LO: role of the Transport Layer and the services it gives applications | UDP versus TCP: when would you pick UDP? (touches TCP and UDP services only) | What does the transport layer give application processes that the network layer does not? | partly |
| Focus: what communication services does the Transport Layer provide to application processes? | same as above | same as above; How does TCP give two processes reliable, in-order delivery over an unreliable network? | partly |
| LO: how multiplexing and demultiplexing let many processes share the network | What are multiplexing and demultiplexing in the transport layer? | UDP versus TCP demultiplexing: how does the receiving host choose the socket? | partly (port only, no 4-tuple) |
| Focus: how does a receiving host know which process should get an incoming segment? | same as above | same as above | partly |
| LO: operation and characteristics of UDP | UDP versus TCP: when would you pick UDP? | What is in a UDP segment header, and what does the UDP checksum protect against?; Why can UDP's lack of congestion control be an advantage, and what does it cost? | partly (no header, checksum or connectionless detail) |
| Focus: why might an application choose UDP rather than TCP? | UDP versus TCP: when would you pick UDP? | Why can UDP's lack of congestion control be an advantage, and what does it cost? | partly (slide reasons missing: no handshake RTT, no state, small header, no congestion control; reliability can be added in the app) |
| LO: fundamental mechanisms of reliable data transfer | Go-Back-N versus Selective Repeat: what does each resend after a loss? | Which problem does each reliable data transfer mechanism solve?; Why is stop-and-wait so slow, and how does pipelining help? | partly (pipelined recovery only) |
| Focus: how can two end systems communicate reliably over an unreliable network? | Go-Back-N versus Selective Repeat | Which problem does each reliable data transfer mechanism solve? | partly |
| LO: how TCP provides connection-oriented, reliable transport between processes | What is the TCP three-way handshake? | TCP sequence number versus acknowledgement number: what does each one count?; How does a TCP sender find out that a segment was lost?; How does TCP give two processes reliable, in-order delivery over an unreliable network? | partly (connection setup only) |
| Focus: how does TCP provide reliable, ordered communication between two processes? | What is the TCP three-way handshake? | the three cards above | partly |
| LO: purpose of TCP connection management and flow control | What is the TCP three-way handshake?; Flow control versus congestion control in TCP | Why does TCP open a connection with three messages and not two?; How does TCP flow control stop a sender from overflowing the receiver? | partly (the steps, not the purpose; rwnd named but not how it works) |
| LO: why congestion occurs and the basic principles of congestion control | Flow control versus congestion control in TCP | Why does network congestion happen, and what does it cost?; How can a TCP sender learn that the network is congested? | partly (no causes, costs, or end-to-end versus network-assisted) |
| Study guide: distinguish congestion control from flow control | Flow control versus congestion control in TCP | How does TCP flow control stop a sender from overflowing the receiver? | full |
| LO: how TCP congestion control adapts the sending rate | How does TCP's congestion window grow and shrink (slow start and AIMD)? | Triple duplicate ACK versus timeout: how does TCP change cwnd and ssthresh?; TCP CUBIC versus classic AIMD: how do they differ?; How can a TCP sender learn that the network is congested? | partly (loss reaction imprecise, no ssthresh, timeout, CUBIC, delay-based or ECN) |
| Focus: how can a sender adapt its rate when the network becomes congested? | same as above | same as above | partly |
| LO: apply transport-layer concepts to analyse basic TCP performance and throughput | none | What determines the throughput a TCP connection can achieve?; Why is stop-and-wait so slow, and how does pipelining help? | not |
| Focus: what determines the throughput a TCP connection can achieve? | none | What determines the throughput a TCP connection can achieve? | not |
| Before the quiz: know why each mechanism is needed and what problem it solves | none directly | Which problem does each reliable data transfer mechanism solve? (and the "why" prompts on UDP, the handshake and congestion) | partly |
| Before the quiz: reliable data transfer | Go-Back-N versus Selective Repeat | as in the reliable data transfer rows | partly |
| Before the quiz: differences between TCP and UDP | UDP versus TCP: when would you pick UDP? | UDP versus TCP demultiplexing; Why can UDP's lack of congestion control be an advantage, and what does it cost? | full |
| Before the quiz: flow control versus congestion control | Flow control versus congestion control in TCP | How does TCP flow control stop a sender from overflowing the receiver? | full |
| Before the quiz: TCP performance calculations from the learning activities | none | Why is stop-and-wait so slow, and how does pipelining help?; What determines the throughput a TCP connection can achieve?; How does a TCP sender find out that a segment was lost? (timeout formula) | not |
| Lecture topic beyond the objectives: transport evolution and QUIC (two Check Your Understanding questions in 3.3) | none | What is QUIC, and what does it improve over HTTP on TCP and TLS? | not |

## Corrections to existing cards

All six are in `data/cards/2026-10-03-earlier-weeks.json`. None is wrong in substance; these are precision and source fixes.

1. **What is the TCP three-way handshake?** Source `3.2` should be `3.3`: connection management (the handshake, why 2-way fails, closing with FIN) is on the Lecture 6 slides, and the Lecture 5 TCP transcript says the handshake comes in the next lecture. Add `3.1`, since it serves the connection management objective. Optionally name the numbers: the SYNACK acknowledges `x+1`, the final ACK acknowledges `y+1`.
2. **How does TCP's congestion window grow and shrink (slow start and AIMD)?** "On a loss, it is cut, roughly in half" is imprecise. The L06 slides separate the two loss signals: after a triple duplicate ACK, TCP Reno halves (fast recovery, `cwnd = ssthresh + 3` MSS); after a timeout, cwnd goes to 1 MSS and slow start begins again (TCP Tahoe does this for both). Also name the start (cwnd = 1 MSS) and the threshold (`ssthresh`, set to half of cwnd at the last loss). Add `3.1`.
3. **What are multiplexing and demultiplexing in the transport layer?** "The port number in each arriving segment says which program gets it" holds for UDP (destination port only) but not TCP, which uses the 4-tuple of source and destination IP and port; many TCP sockets on a server share port `80`. The Key line ("the port finds the program") inherits the same simplification. Add `3.1`.
4. **Go-Back-N versus Selective Repeat: what does each resend after a loss?** "The receiver throws away everything after a gap" is what the slide example does, but the slides (and the textbook author's video) say a Go-Back-N receiver may discard or buffer out-of-order packets, an implementation choice; either way it re-ACKs the highest in-order packet. Also precise: on a timeout for packet n, the sender resends n and every higher-numbered packet already sent in the window. Add `3.1`.
5. **UDP versus TCP: when would you pick UDP?** Correct, but "UDP is fast" stands in for the four reasons the L07 slides list (no connection setup delay, no connection state, small header, no congestion control); consider naming them. Add `3.1`, as it answers a focus question.
6. **Flow control versus congestion control in TCP: what does each protect?** Correct. "Slows down when packets get lost" describes classic loss-based TCP; delay-based TCP and ECN also exist (L06). Add `3.1`, as the Study Guide asks for exactly this distinction.

## Notes

- **Missing material.** The TCP Part 2 video (E4I6t0mI_is), which covers flow control and connection management, has no captions, so those cards rest on the L06 slides alone. The Knowledge Checks and Problems the lecture pages link (for example "TCP congestion window evolution", "TCP RTT and timeout", "Internet Checksum") are external and were not in the downloaded material.
- **Throughput formula.** The course learning outcome says "compute TCP throughput in a sample network", but no material in the module gives the textbook's average-throughput formula for a saw-tooth connection. The throughput card uses only what the slides teach: rate about `cwnd / RTT`, the cwnd and rwnd limits, the bottleneck link, the R/K fair share, and stop-and-wait utilization. If a later activity introduces a formula, add a card for it.
- **Slides versus captions on loss reaction.** The textbook author's TCP congestion control video says the window is cut in half on a triple duplicate ACK; the L06 slides give TCP Reno's fast recovery value `cwnd = ssthresh + 3` MSS. The cards follow the slides.
- **Teacher transcript slips.** In the Lecture 5 recording the stop-and-wait transmit time is said as "eight milliseconds or a microsecond" (slides: 8 microseconds), and a premature timeout is described as the timeout being "too long" (the slides and scenario mean too short). The transcript also says the MSS is agreed in the handshake, which the slides do not say. The cards follow the slides and do not use the MSS claim.
- **Out-of-order segments.** Slides, transcript and video agree that the TCP specification leaves out-of-order handling to the implementer; the cards say so rather than picking one behaviour.
- **Item numbers.** Canvas numbers both the Lecture 7 discussion and the Module 3 Quiz `3.4`. The cards cite `3.4` for Lecture 7, and the upload tool resolves `3.4` to the first match, which is the lecture.
- **Quiz content.** No card reproduces a Module 3 Quiz or midterm question; the Check Your Understanding questions were used only to see which ideas the lectures stress.
