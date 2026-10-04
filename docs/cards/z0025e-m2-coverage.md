# Z0025E Module 2 (Application Layer): Card coverage

Audit of 2026-10-04. It maps every Learning Objective and Study Guide focus question in the Module 2
overview (Canvas item 2.1), the extra objective listed in 2.6, and the overview's advice before the
Module 2 Quiz, to the Concept Cards that cover them.

- Existing cards: the 8 Module 2 cards in `data/cards/2026-10-03-earlier-weeks.json` (named by prompt
  below). `data/cards/2026-10-03-ip-and-patterns.json` has no Module 2 cards.
- New cards: the 18 in `data/cards/2026-10-04-z0025e-m2.json`.
- Status is the coverage before the new cards, then after.

## Coverage

| Objective or focus question | Existing cards | New cards | Status (before, after) |
|---|---|---|---|
| LO: explain the basic principles and architectures of network applications | Client-server versus P2P | What can an application need from the transport layer?; What does an application-layer protocol define, and what makes it open or proprietary?; How does a message reach the right process on another host? | partly, fully |
| LO: describe how processes communicate using application-layer protocols and transport services | none | How does a message reach the right process on another host?; What can an application need from the transport layer?; TCP service versus UDP service | not, fully |
| LO: explain how HTTP supports communication between web clients and servers | Non-persistent versus persistent HTTP; HTTP status codes; HTTP is stateless (cookies); Web cache | What happens between a browser and a web server when you open a web page?; Conditional GET; Head-of-line blocking and HTTP/2; First-party versus third-party cookies | partly (no request and response messages), fully |
| LO: describe how Internet email uses SMTP and IMAP | SMTP versus IMAP | How does an email travel from Alice's mail program to Bob's mailbox?; SMTP versus HTTP | partly, fully |
| LO: explain the purpose and hierarchical operation of DNS | How is DNS organised; Iterative versus recursive DNS query | Why is DNS spread over many servers instead of one central server?; DNS record types A, NS, CNAME and MX | partly (no reasons for distribution, no records, no TTL), fully |
| LO: distinguish client-server and P2P architectures | Client-server versus P2P | Why does P2P file distribution scale better than client-server? | partly (scalability only stated), fully |
| LO: describe the basic principles of video streaming and CDNs | none | How does video coding make a video smaller?; Why does a video player buffer?; How does DASH adapt video quality?; Why is video delivered by a CDN? | not, fully |
| LO (listed in 2.6 only): explain how applications use TCP and UDP sockets | none | UDP socket versus TCP socket; How does a message reach the right process on another host? | not, fully |
| Contributes to: present major application-layer protocols in detail | the HTTP, DNS and email cards | all HTTP, email and DNS cards above | partly, fully |
| Contributes to: purpose and organisation of the Internet protocol stack | (Module 1 cards on layers) | TCP service versus UDP service; How does a message reach the right process? (the socket as the door between application and transport) | partly, fully for this module's share |
| Focus: what does a network application need for processes on different end systems to communicate? | Client-server versus P2P | How does a message reach the right process?; What can an application need from the transport layer?; TCP service versus UDP service; What does an application-layer protocol define? | not (only the architecture part), fully |
| Focus: what happens between a browser and a web server when you request a resource? | Persistent HTTP; status codes; cookies; web cache | What happens between a browser and a web server when you open a web page?; Conditional GET; HTTP/2 | partly, fully |
| Focus: how does an email travel from sender to the recipient's mailbox? | SMTP versus IMAP | How does an email travel from Alice's mail program to Bob's mailbox? | partly (roles named, no path), fully |
| Focus: how does the Internet find where to send a request when you enter a domain name? | How is DNS organised; Iterative versus recursive | Why is DNS spread over many servers?; DNS record types (A record as the final answer, TTL and caching); What happens between a browser and a web server (DNS as the first step) | mostly, fully |
| Focus: how does a P2P application differ from a client-server one? | Client-server versus P2P | Why does P2P file distribution scale better? | partly, fully |
| Focus: why is Internet video delivered by distributed infrastructure rather than one central server? | none | Why is video delivered by a CDN?; How does DASH adapt video quality? | not, fully |
| Focus: how does an application use a socket to communicate with a process on another end system? | none | UDP socket versus TCP socket; How does a message reach the right process? | not, fully |
| Before the quiz: what problem each major protocol or service solves, and how it works at a high level | HTTP, DNS and email cards (partly) | browser and web server; email path; why DNS is distributed; P2P scalability; DASH; CDN; sockets | partly, fully |
| Before the quiz: compare client-server and P2P | Client-server versus P2P | Why does P2P file distribution scale better? | fully (concept), fully with the numbers |
| Before the quiz: compare TCP and UDP from the application's perspective | none in Module 2 (the Module 3 card "UDP versus TCP: when would you pick UDP?" is about the transport layer) | TCP service versus UDP service; UDP socket versus TCP socket | not, fully |

Lecture emphasis also covered: open versus proprietary protocols and TLS (2.3 Check Your
Understanding), SMTP push versus HTTP pull (2.3), conditional GET, HTTP/2 frames and HOL blocking,
spatial and temporal coding, streaming and buffering, DASH at the client (all 2.4 Check Your
Understanding), and third-party cookies and GDPR (six slides in L04).

Not made into cards on purpose: the web cache utilisation calculation and the P2P delay problem
(numerical Problems in 2.4, better practised there), the SMTP handshake transcript, DNS security
(DDoS, spoofing, DNSSEC) and registering a domain (one slide each), HTTP methods beyond GET (one
slide; a candidate for a later card).

## Corrections to existing cards

1. "What do the HTTP status codes 200, 301, 404 and 500 mean?": the L04 slides list `200`, `301`,
   `400 Bad Request`, `404` and `505 HTTP Version Not Supported`; `500` is not in the slides or the
   transcripts. Suggest replacing `500` with `400` and `505` (prompt and answer), so the card matches
   what the course teaches. The `Key:` line (classes 2xx to 5xx) is still right.
2. "Client-server versus peer-to-peer (P2P): what is the difference?": sources should be `2.3`,
   `2.4`, `2.1` (P2P is taught again in L04 with the distribution-time model, and the card answers a
   focus question). The answer leaves out two points the slides stress: clients do not talk to each
   other, and P2P peers come and go and change IP addresses, so management is complex.
3. "SMTP versus IMAP: what does each one do?": add `2.1` to the sources (focus question on email).
   Content is correct.
4. "How is DNS organised, and what does it do?" and "Iterative versus recursive DNS query": add `2.1`
   to the sources (DNS focus question). Content is correct and matches the slides.
5. "What does a web cache (proxy server) do, and why does it help?": correct. It could add that the
   cache is a server to the browser and a client to the origin server (a 2.4 Check Your Understanding
   point), and that the origin server says in its response headers how long an object may be cached.
6. "Non-persistent versus persistent HTTP": correct. Optional precision from the slides: non-persistent
   HTTP costs `2 RTT + file transmission time` per object; persistent HTTP can fetch all referenced
   objects in as little as one RTT in total.
7. Outside Module 2, for information: the Module 3 card "UDP versus TCP: when would you pick UDP?"
   lists DNS lookups as a UDP use; the L03 material says DNS uses both UDP and TCP. Not wrong, but
   incomplete.

## Notes

- IMAP is in the overview's objectives and in the L03 slide outline, but the L03 slides have no IMAP
  slide. The only source is the textbook author's Email video (linked from 2.3), which names IMAP as
  the most used mail access protocol (RFC 3501) and mentions HTTP (webmail) as another way. The email
  card uses only that.
- The L04 video streaming transcript (the teacher's recording) calls the video and CDN infrastructure
  "P2P" several times and says P2P is the only way to deliver it. The slides call it a distributed,
  application-level infrastructure of CDN servers storing copies, and the textbook video says the same.
  The cards follow the slides: a CDN is servers, not peers.
- The same transcript describes "bring home" as interconnecting big ISPs; the slides say a smaller
  number of larger clusters in POPs near access networks. The CDN card follows the slides.
- Traffic share figures differ: the transcript and the textbook video say about 80% of residential ISP
  traffic is video; the slides give about 48% of residential downloads (2026) and about 54% of
  downstream volume (2024). No card states a figure.
- The 2.3 Check Your Understanding explanation for the SMTP versus HTTP question says HTTP "generally
  has just one object in each request"; the SMTP versus HTTP card says one object per response, which
  is how the slides and the textbook put it.
- The 2.6 end page lists an eighth objective (TCP and UDP sockets) that the 2.1 overview does not; both
  are in the table.
- Five files linked from 2.6 could not be read (Canvas 404), and the Knowledge Checks and Problems
  pages are not in the downloaded material, so they were not checked against the cards. (Since downloaded: see Textbook exercises below.)

## Textbook exercises

Added 2026-10-04. The Knowledge Checks and interactive problems on the textbook site
(gaia.cs.umass.edu) that Canvas items 2.3 and 2.4 link to, read from the cached copies listed in
`cache/course-material/Z0025E/m2/index.md`. The 19 hint Cards in
`data/cards/2026-10-04-z0025e-m2-exercises.json` say how to approach each kind of question and
point to the concept cards above; they do not give the answers.

| Exercise | Linked from | Hint cards (by prompt) |
|---|---|---|
| Knowledge Check: Principles of Network Applications (4 questions) | 2.3 | ...client-server versus P2P?; ...the services TCP and UDP give an application? |
| Knowledge Check: Email (5) | 2.3 | ...the RTTs before the email itself can be sent?; ...comparing HTTP with SMTP and matching mail protocols? |
| Knowledge Check: DNS (9) | 2.3 | ...how long each DNS request takes?; ...DNS servers, records and caching? |
| Knowledge Check: Socket Programming (5) | 2.3 | ...UDP and TCP socket properties?; ...counting sockets and what connect() does? |
| Knowledge Check: Web and HTTP (15) | 2.4 | ...an HTTP request or reply shown in full?; ...statelessness and cookies?; ...GET, conditional GET, web caches and HTTP/2? |
| Knowledge Check: Video Streaming and Content Distribution Networks (4) | 2.4 | ...DASH, manifests and CDNs? |
| Interactive problem: HTTP GET (8 questions) | 2.4 | Interactive problem, HTTP GET: how do you solve it? |
| Interactive problem: HTTP RESPONSE (7) | 2.4 | Interactive problem, HTTP RESPONSE: how do you solve it? |
| Interactive problem: Browser Cache (1) | 2.4 | Interactive problem, Browser Cache: how do you solve it? |
| Interactive problem: client-server and P2P file distribution delays (4) | 2.4 | Interactive problem, A comparison of client-server and P2P file distribution delays: how do you solve it? |
| Interactive problem: DNS Basics (13) | 2.3 | Interactive problem, DNS Basics: how do you solve it? |
| Interactive problem: DNS, Iterative vs Recursive Query (animation, no questions) | 2.3 | Interactive problem, DNS - Iterative vs Recursive Query: how do you solve it? |
| Interactive problem: Electronic Mail and SMTP (8) | 2.3 | Interactive problem, Electronic Mail and SMTP: how do you solve it? |

The Knowledge Check prompts all start "Knowledge Check, <check title>: how do you answer questions
about".

### Notes on the exercises

- Taught only in the textbook, not in the course: the `Accept-Language` weights (`q=`), which the
  L04 slides show in an example request without explaining; the ETag, which a slide shows in a
  response without explaining and the HTTP RESPONSE problem asks about (even when its reply has no
  ETag line); the SMTP handshake (`220`, `HELO`, `250`) behind the Email check's RTT question, which
  is only in the textbook's Email video, and the check's figure is not in the cached page. DNS port
  53 is named only in the textbook's socket video. The hint cards explain each of these briefly.
- Web and HTTP check, language question: the options include languages that are not in the request
  at all. The HTTP GET problem's solution treats an unlisted language as not accepted, so "least
  preferred" must mean the lowest weight among the listed ones. The hint card says so.
- Web and HTTP check: its example reply has `Content-type: image/html` (not a real media type) and a
  `Last-Modified` time later than its `Date`. Neither affects the questions.
- DNS Basics: the solution text says the company's server holds four record types (A, CNAME, NS,
  MX), but in the example the NS record is on the TLD server and the accepted answer counts the
  company's list (three types). The example's TLD NS record also names `www.enterprise.com` where the
  L03 slides put the domain (`networkutopia.com`) in an NS record.
- Electronic Mail and SMTP: the problem says both mail programs use HTTP, but its solution answers
  SMTP for the step from Alice's mail program to her server and HTTP only for Bob reading. With
  webmail, that first step would really be HTTP too. The hint card warns about this.
- Browser Cache: the solution assumes an already open persistent connection (one RTT per request,
  no TCP setup) and does not round the number of changed objects. Both fit the slides' conditional
  GET; the hint card states the assumption.
- HTTP/2 question in the Web and HTTP check: one option credits HTTP/2 with TLS security. The L04
  slides say HTTP/2 over TCP has no security and HTTP/3 adds it, so the check and the slides agree.
- Video streaming: the cards follow the slides (a CDN is servers, not peers; see the note above on
  the L04 transcript).
- Socket Programming check, connect() question: in the L03 slide code `socket()` creates the client
  socket and `connect()` only connects it; the hint card points students to that code.
