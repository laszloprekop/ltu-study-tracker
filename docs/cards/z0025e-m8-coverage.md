# Z0025E Module 8 (Security): Card coverage audit

Drafted 2026-10-07 (Claude) from the Module 8 overview (8.1), the lecture pages 8.2 (Lecture 15) and 8.3 (Lecture 16)
and the L15 and L16 slides. No cards existed for this module; the new cards are in
`data/cards/2026-10-07-z0025e-m8.json` (39 cards: 15 on Lecture 15, 23 on Lecture 16, 1 on the overview). Cards are
named by prompt.

Status is the coverage after the new cards: full, partly or not.

## Coverage

| Objective or focus question | New cards | Status after |
|---|---|---|
| LO: identify and describe common network security threats and attacks | What can an intruder do to a network conversation, and which security goal does each act threaten?; Which three attacks on an encryption scheme are there, sorted by what the attacker holds?; the replay, man-in-the-middle, re-ordering and truncation cards below | full |
| LO: explain the security goals of confidentiality, authentication, message integrity and availability | Which four goals does secure network communication have? | full |
| Focus: what exactly are we trying to protect, and what can an attacker do to compromise it? | Which four goals does secure network communication have?; What can an intruder do to a network conversation, and which security goal does each act threaten? | full |
| LO: explain the basic principles of symmetric-key and public-key cryptography | Symmetric key versus public key cryptography: what is the difference?; DES versus AES: how do the two symmetric key standards differ?; Which two requirements must a public key encryption algorithm such as RSA meet?; Why is public key cryptography used only to exchange a session key, not to encrypt all the data? | full |
| LO: distinguish between encryption, cryptographic hashing, message authentication and digital signatures | Encryption, hash, MAC and digital signature: which security property does each one give?; What is a message digest, and which properties must a cryptographic hash function have?; How is a simple digital signature made and checked, and what does it prove? | full (MAC only as far as the slides go, see Notes) |
| Focus: how can a receiver verify both who sent a message and whether it was altered? | Why is the message digest signed instead of the whole message, and how is it verified?; How is a simple digital signature made and checked, and what does it prove?; What does a Certification Authority (CA) do, and how does Alice use a certificate? | full |
| Study guide: why encryption alone does not solve every security problem | Authentication protocols ap1.0 to ap3.1: why does each attempt to prove identity fail?; What is a nonce, and how does it stop a replay attack in authentication (ap4.0)?; How does ap5.0 authenticate with a public key, and how does a man-in-the-middle attack break it?; How does Alice send Bob a confidential e-mail, and why does she use two kinds of key? | full |
| LO: explain how cryptographic mechanisms can be combined to provide confidentiality, integrity and authentication | Which three keys does Alice use for an e-mail with confidentiality, integrity and authentication?; Why is public key cryptography used only to exchange a session key, not to encrypt all the data?; Encryption, hash, MAC and digital signature | full |
| LO: describe how security mechanisms can be applied to e-mail communication | How does Alice send Bob a confidential e-mail, and why does she use two kinds of key?; Which three keys does Alice use for an e-mail with confidentiality, integrity and authentication? | full |
| LO: explain the purpose and basic operation of TLS | What is TLS, and which three security services does it give an application?; Which four phases does a TLS connection go through?; What happens in the handshake of the toy TLS protocol (t-tls), and what is its drawback?; Why does TLS derive four keys from the master secret instead of using one key?; Why does TLS cut the data stream into records, each with its own MAC?; How does TLS defend the data stream against re-ordering and replay attacks?; What is a truncation attack on TLS, and how do record types prevent it? | full |
| LO: explain at a high level how IPsec provides security at the Network Layer | IPsec transport mode versus tunnel mode: what does each one protect?; AH versus ESP: what does each IPsec protocol provide?; What is a VPN, and how does IPsec carry traffic between two offices of one organization?; What is an IPsec security association (SA), and what does a router store for it?; How does IPsec stop an attacker from replaying a sniffed datagram?; What is IKE in IPsec for, and how do its PSK and PKI variants differ? | full |
| Focus: what changes when security is applied at the application, transport or network layer? | At which parts of the network can security be applied, and what does each mechanism protect? (and the e-mail, TLS and IPsec cards above) | full |
| LO: identify important security considerations in wireless and mobile networks | Which four steps make an 802.11 (WiFi) connection secure?; How does authentication in 4G LTE work, and how does it differ from WiFi? | full |
| Focus: what additional security concerns arise when network traffic is transmitted over the air? | the two cards above (the mechanisms only) | partly (see Notes: the material names the shared broadcast medium but does not develop the concerns) |
| LO: explain the purpose and basic operation of firewalls | What is a firewall, and why does an organization use one?; How does a stateless packet filter decide whether to forward or drop a packet?; Stateless versus stateful packet filter: what is the difference?; What is an application gateway, and how does it control telnet access to the outside?; Which limitations do firewalls and application gateways have? | full |
| LO: explain the role of IDS in identifying potentially malicious network activity | Firewall versus intrusion detection system (IDS): what does each one do? | full |
| Focus: how can a network restrict unwanted traffic and identify potentially malicious behaviour? | Firewall versus intrusion detection system (IDS); What is a firewall, and why does an organization use one? | full |
| Before the quiz: connect each threat to the property it threatens and the mechanism that defends against it | What can an intruder do to a network conversation, and which security goal does each act threaten?; Encryption, hash, MAC and digital signature; the attack-and-defence cards (nonce, CA, TLS sequence numbers, record types, IPsec sequence numbers) | full |
| Before the quiz: why different security mechanisms are applied at different parts of the network stack | At which parts of the network can security be applied, and what does each mechanism protect? | full |
| Lecture 15 topic: DES and AES | DES versus AES: how do the two symmetric key standards differ? | full |
| Lecture 15 topic: Certification Authorities | What does a Certification Authority (CA) do, and how does Alice use a certificate? | full |

## Notes

- **Missing material.** Module 8 has no lecture recording, transcript or video captions, and `index.md` lists no
  Knowledge Checks or interactive problems. Every card rests on the two slide packs and the three Canvas pages. The
  textbook pages the lectures point to were not in the downloaded material and were not used. The L15 file is named
  "[Old] L15"; it is the only Lecture 15 slide pack Canvas links.
- **Wireless focus question.** The Study Guide asks what extra concerns arise over the air and mentions the shared
  broadcast medium. The slides only show the 802.11 and 4G procedures (authentication, key derivation, encryption), not
  the concerns themselves. The cards cover the procedures and add nothing from outside. If a later activity develops the
  threats (eavesdropping on the air, rogue access points), add a card.
- **Threat to goal mapping.** The slides list what an intruder can do (eavesdrop, insert, impersonate, hijack, denial of
  service) and the four goals on separate slides; the Study Guide asks students to connect them. The intruder card makes
  that connection for four of the five attacks (eavesdropping to confidentiality, inserting to integrity, impersonation
  to authentication, denial of service to availability). The pairing is the obvious one but is not written out in the
  material. Hijacking is described without a goal.
- **Overlap with Module 1.** A Module 1 card already covers packet sniffing, IP spoofing and denial of service with
  their defences. The intruder card repeats the names of eavesdropping, spoofing and denial of service in one clause
  each, but its idea is the link to the security goals, plus insertion and hijacking, which Module 1 does not card.
- **MAC.** The learning objective names "message authentication", but the slides never define a MAC. It appears only in
  the toy TLS slides ("Hash message authentication code (MAC)", a MAC key per direction, one MAC per record). The
  comparison card says just that. It cites 8.2 and 8.1, although the MAC detail is from 8.3 (two sources per card).
- **Replay or playback.** The slides say "playback attack" for ap3.0, the lecture page and the TLS slides say "replay".
  The cards use "replay attack" throughout and give the slide word once.
- **Slide slips.** The 802.11 slide writes "nonces (relay attack)"; the cards treat it as replay. The stateful filter
  slide describes the nonsense packet as "dest port = 80, ACK bit set", while the ACL row beside it has source port 80;
  the card names only the ACK bit without a connection. The IPsec summary slide says "ESP protocol (with AH)
  additionally provides encryption", while the protocol slide says ESP alone gives authentication, integrity and
  confidentiality; the AH versus ESP card follows the protocol slide. The slides give TLS 1.3 as "RFC 8846"; the cards
  leave the RFC number out. The slides spell RSA's third author "Adelson"; the card keeps the slide spelling.
- **CA and man-in-the-middle.** The slides repeat the ap5.0 attack under the title "how to fix it" and then introduce
  the CA, without spelling out the fix. The CA card says only that the certificate closes that gap.
- **Not examined.** The slides mark the DES internals (cipher block chaining, p. 616 to 618) and the RSA mathematics
  (p. 620 to 622) as not examined. No card goes into them. The slide's side note on privacy and the CIA triad label
  have no card: the slides name the triad but do not define it beyond the four goals.
- **EAP.** The 802.11 slides name EAP, EAPoL and RADIUS in a protocol diagram. The 802.11 card leaves them out for
  length; add a card if the quiz asks for them.
- **TLS and QUIC.** The "HTTP view of TLS" slide (HTTP/3 over QUIC, which includes TLS, over UDP) is not carded: a
  Module 3 card already covers QUIC.
- **Check Your Understanding.** The questions in 8.2 and 8.3 are formative, not graded. They were used to see which
  ideas the lectures stress (the four TLS keys, DES key size, transport versus tunnel mode, stateful versus stateless).
  No card reproduces a Module 8 Quiz question.
- **Length.** Every answer is at most 600 characters and has at most five list lines. Several topics were split or
  trimmed to fit (for example, the SA card lists what is stored without the example values of the IKE slide).
