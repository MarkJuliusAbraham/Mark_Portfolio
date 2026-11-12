import { CaseStudy, ReadingVersions } from "./CaseStudy.jsx";
import { CaseStudyOpening, Separator } from "./CaseStudyOpening.jsx";
import { Plain } from "./Plain.jsx";
import { Arrowhead, FigureLabel, Placeholder } from "./diagram.jsx";
import "./case-study.css";

// Grounded in Dev/Learn/CaseRoute: README.md, generator/README.md, processor/README.md and the
// dashboard's Documentation tab (architecture FAQ and load test findings). Media slots stay labelled
// until recordings are available.

const Box = ({ x, y, width = 180, height = 72, name, note, code }) => (
  <g>
    <rect x={x} y={y} width={width} height={height} className="cs-node" />
    <path d={`M${x},${y} h7 L${x},${y + 7} z`} className="cs-fill-ink" />
    <text x={x + 12} y={y + 22} className="cs-name">{name}</text>
    {note && <text x={x + 12} y={y + 40} className="cs-note">{note}</text>}
    {code && <text x={x + 12} y={y + 59} className="cs-state-line">{code}</text>}
  </g>
);

// The route a case takes, as the snake the figure draws: left to right, back, then down and across.
const route = [
  { name: "Generator", note: "plays the customers", code: "generator", simple: "Thousands of simulated customers send support cases." },
  { name: "Intake", note: "replies 202 Accepted", code: "backend", simple: "The backend accepts each case as soon as it is safely queued." },
  { name: "cases.submitted", note: "the durable promise", code: "Kafka", simple: "The queue holds every accepted case until it is saved." },
  { name: "Case writer", note: "saves in batches", code: "backend", simple: "Cases are saved to the database in batches." },
  { name: "Cases + outbox", note: "one transaction", code: "PostgreSQL", simple: "Each saved case also records that it still needs processing." },
  { name: "Outbox relay", note: "announces saved cases", code: "backend", simple: "Those records are handed on to processing." },
  { name: "cases.saved", note: "awaiting processing", code: "Kafka", simple: "Saved cases wait in a second queue." },
  { name: "Processor", note: "slow, sometimes fails", code: "processor", simple: "A separate service does the slow work of routing each case." },
  { name: "cases.processed", note: "ROUTED or FAILED", code: "Kafka", simple: "Results wait in a third queue." },
  { name: "Result writer", note: "updates OPEN cases", code: "backend", simple: "Each result is recorded on its case, once." },
];

const at = [
  [0, 50], [248, 50], [496, 50], [744, 50],
  [744, 190], [496, 190], [248, 190], [0, 190],
  [0, 330], [248, 330],
];

const PipelineDiagram = () => (
  <svg viewBox="-24 -8 948 428" role="img" aria-label="A case's route through CaseRoute. The generator posts a submission to the backend's intake, which replies 202 Accepted once Kafka confirms the write to cases.submitted. The case writer saves submissions to PostgreSQL in batches, writing each case and an outbox row in one transaction. The outbox relay publishes saved cases to cases.saved, the processor consumes them and publishes ROUTED or FAILED results to cases.processed, and the result writer records each result on its case, only while the case is still OPEN. Unreadable messages go to dead-letter topics, and the checker compares every reply the generator received with what PostgreSQL stored.">
    <defs><Arrowhead id="cr-arrow" /></defs>
    <FigureLabel number="01" title="A CASE'S ROUTE" />

    {route.map((box, i) => <Box key={box.name} x={at[i][0]} y={at[i][1]} {...box} />)}

    <g className="cs-wire" markerEnd="url(#cr-arrow)">
      <line x1="180" y1="86" x2="246" y2="86" />
      <line x1="428" y1="86" x2="494" y2="86" />
      <line x1="676" y1="86" x2="742" y2="86" />
      <line x1="834" y1="122" x2="834" y2="188" />
      <line x1="744" y1="226" x2="678" y2="226" />
      <line x1="496" y1="226" x2="430" y2="226" />
      <line x1="248" y1="226" x2="182" y2="226" />
      <line x1="90" y1="262" x2="90" y2="328" />
      <line x1="180" y1="366" x2="246" y2="366" />
      <path d="M428,366 H880 V264" fill="none" />
    </g>
    <g className="cs-note">
      <text x="213" y="78" textAnchor="middle">POST</text>
      <text x="462" y="78" textAnchor="middle">acks=all</text>
      <text x="709" y="78" textAnchor="middle">consume</text>
      <text x="826" y="160" textAnchor="end">insert, ignore repeats</text>
      <text x="711" y="218" textAnchor="middle">poll</text>
      <text x="463" y="218" textAnchor="middle">publish</text>
      <text x="215" y="218" textAnchor="middle">consume</text>
      <text x="98" y="300">result</text>
      <text x="213" y="358" textAnchor="middle">consume</text>
      <text x="654" y="358" textAnchor="middle">record, only if still OPEN</text>
      <text x="496" y="398">Unreadable messages go to .DLT topics.</text>
      <text x="496" y="416">The checker compares every reply with what was stored.</text>
    </g>
  </svg>
);

// Stands in for the figure on narrow screens; in the overview it is the figure.
const RouteList = ({ compact = true }) => (
  <div className={compact ? "cs-compact cs-flow-figure" : "cs-flow-figure"}>
    <ol className="cs-flow">
      {route.map(({ name, note, code, simple }) => (
        <li key={name} className="cs-flow-stage">
          <b className="cs-flow-name">{name}</b>
          <span className="cs-flow-made"><Plain simple={simple}>{note}</Plain></span>
          <code className="cs-flow-by cs-technical">{code}</code>
        </li>
      ))}
    </ol>
    <p className="cs-flow-branch typeset-card-toner">
      <Plain simple="Messages that can't be read are set aside instead of lost, and a checker confirms every case afterwards.">
        Unreadable messages go to .DLT topics, and the checker compares every reply with what was stored.
      </Plain>
    </p>
  </div>
);

const guarantees = [
  {
    fix: "Idempotent by clientRequestId",
    simple: "Sending a case twice never creates two",
    how: "Every submission carries a UUID chosen by the client, with a unique index on it. A resend is ignored (ON CONFLICT DO NOTHING), so a client that is unsure may always retry.",
    simpleHow: "Each case carries its own ID from the customer's side, so a repeat is recognized and ignored. That makes it safe to send again whenever an answer is lost.",
  },
  {
    fix: "No dual writes",
    simple: "A saved case is never forgotten",
    how: "Saving a case and announcing it are writes to two systems. The case and its outbox row commit in one transaction, and a relay publishes the row afterwards, so a saved case always reaches processing.",
    simpleHow: "Saving a case and queuing it for processing happen together, so one can never happen without the other.",
  },
  {
    fix: "At-least-once delivery, exactly-once effect",
    simple: "Repeats do no harm",
    how: "Kafka may redeliver a message. Every consumer's write tolerates it: inserts ignore duplicates, and a result only updates a case that is still OPEN.",
    simpleHow: "Messages may arrive more than once, but each case is still saved once and processed once.",
  },
  {
    fix: "Nothing silently dropped",
    simple: "Bad messages are set aside",
    how: "A message that can't be used goes to a dead-letter (.DLT) topic, with the reason in a header, instead of blocking its partition or vanishing.",
    simpleHow: "A message that can't be read is moved aside with the reason, so it neither blocks the queue nor disappears.",
  },
];

// Measured on one Windows PC (20 logical cores) running every service at once.
const findings = [
  { load: "1,000,000/min, retry period on", result: "All 1,000,000 saved and processed", detail: "739,711 accepted during the run; the retry period recovered the other 260,289 in 2 passes (23 s)." },
  { load: "800,000/min", result: "681,391 accepted, 0 unknown", detail: "About 11,350 per second. The rest were skipped before sending, so nothing was left in doubt." },
  { load: "700,000/min, run until stopped", result: "About 11,650 per second", detail: "Held for over three minutes at around 21 ms per reply." },
  { load: "500,000/min", result: "Keeps up", detail: "Around 30 ms per reply, after a few seconds of slow replies right after the warm-up." },
];

export function CaseRouteCaseStudy() {
  return (
    <CaseStudy className="case-study typeset-card-readable">
      <CaseStudyOpening id="caseroute" summary="Thousands of customers submitting support cases at once, and a system that never loses one.">
        <h1 className="typeset-title">CaseRoute - Reliable Case Intake Under Load</h1>
        <p>A system design case study, built with Java, Spring Boot, Kafka and PostgreSQL.</p>
        <p>
          A load generator plays thousands of customers submitting support cases. The system accepts each one,
          saves it, hands it to a slow and failure-prone processor, and records the result, then a checker proves
          that every customer's answer matches what was actually stored.
        </p>
      </CaseStudyOpening>

      <ReadingVersions overview={<>
        <section>
          <h2 className="typeset-card-title">Every case gets through</h2>
          <p>Up to a million support cases a minute arrive from simulated customers, and each one is saved and processed once.</p>
          <RouteList compact={false} />
          <Placeholder label="GIF: a load test running on the dashboard" />
        </section>
        <section>
          <h2 className="typeset-card-title">Proven, not assumed</h2>
          <p>After every run, a checker compares what each customer was told with what the system stored.</p>
          <Placeholder label="Screenshot: the checker's verdict after a run" />
        </section>
      </>}>

      <section>
        <h2 className="typeset-card-title">The Route a Case Takes</h2>
        <div className="cs-callout">
          <p className="cs-callout-label typeset-card-toner">The goal</p>
          <p className="cs-callout-lead">
            Accept a support case in milliseconds, and never lose or duplicate it, even under overload or a crash.
          </p>
        </div>
        <p className="cs-prose">
          Four applications and two pieces of infrastructure, all on one machine. The backend replies
          202 Accepted only once Kafka has confirmed the write, so an accepted case is already durable. Saving,
          processing and recording the result then happen at their own pace, with Kafka holding the backlog
          between every stage.
        </p>
        <figure className="cs-figure"><PipelineDiagram /><RouteList /></figure>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Four Guarantees</h2>
        <p className="cs-prose">
          <Plain simple="Customers can't see inside the system, so it has to keep a few promises on its own.">
            No single component keeps these alone; each comes from how the components meet.
          </Plain>
        </p>
        <ul className="cs-details-grid">
          {guarantees.map(({ fix, simple, how, simpleHow }) => (
            <li key={fix} className="cs-detail">
              <p className="cs-detail-fix"><Plain simple={simple}>{fix}</Plain></p>
              <p className="cs-detail-how"><Plain simple={simpleHow}>{how}</Plain></p>
            </li>
          ))}
        </ul>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Customers Who Don't Wait</h2>
        <p className="cs-prose">
          <Plain simple="The traffic generator sends cases on a fixed schedule, whether or not the system keeps up, like real customers would. Overload then shows up the way it would in real life: slow replies and lost answers, not a politely slower test.">
            The generator is open-loop: it never waits for a reply before sending the next submission, so overload
            shows up as it would in production, as slow replies, skips and unknown outcomes. It runs up to
            1,000,000 submissions a minute for up to an hour, or until stopped, with memory that stays flat however
            long it runs.
          </Plain>
        </p>
        <Placeholder label="GIF: the dashboard during a run, outcomes and connections updating" />
        <div className="cs-subsection cs-prose cs-technical">
          <h3 className="typeset-card-title">Keeping the Client Honest</h3>
          <ul>
            <li><b>A fixed connection pool.</b> Jetty's HttpClient, 8 instances sharing 2,000 connections, opened gradually during a 30-second warm-up and never closed for being idle. Java's built-in client collapsed near 10,000 requests a second, exhausting Windows' 16,384 local ports.</li>
            <li><b>A waiting line sized by time.</b> 40,000 queued requests, about 4 s of work, far below the 15 s timeout. A request that finds it full is skipped, never sent, so nothing can have been stored.</li>
            <li><b>Outcomes that say what is known.</b> Accepted, Rejected, Blocked (the backend said busy), Skipped (never sent) and Unknown (may or may not be stored). Only Unknowns need the checker to say what really happened.</li>
            <li><b>A circuit breaker.</b> After 20 replies in a row that never reached the backend, it pauses, probes, and ramps back up over 5 s, instead of hitting a down backend at full rate.</li>
            <li><b>A retry period.</b> After the run, everything still Skipped, Blocked or Unknown is resent with its original ID, in passes, until nothing is left.</li>
          </ul>
        </div>
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Proving It: the Checker</h2>
        <p className="cs-prose">
          <Plain simple="A reply only says what the customer was told. The checker downloads the system's own record of every case and compares the two, one by one.">
            A 202 is a promise; the checker verifies it. It streams the backend's ledger (one line per saved case:
            its clientRequestId, status and how many results it received) and compares it with the generator's
            final outcome for every submission. The ledger must end with a row count that matches what was read, so
            a download cut short can never pass as missing cases.
          </Plain>
        </p>
        <ul className="cs-details-grid">
          <li className="cs-detail">
            <p className="cs-detail-fix">Accepted but missing</p>
            <p className="cs-detail-how"><Plain simple="Cases a customer was told were accepted, but that never arrived. Must be 0.">A broken 202. Must be 0.</Plain></p>
          </li>
          <li className="cs-detail">
            <p className="cs-detail-fix">Unknown, saved anyway</p>
            <p className="cs-detail-how"><Plain simple="The answer was lost on the way back, but the case was saved.">The reply was lost; the case was not.</Plain></p>
          </li>
          <li className="cs-detail">
            <p className="cs-detail-fix">Created twice · processed twice</p>
            <p className="cs-detail-how"><Plain simple="Duplicates of any kind. Both must be 0.">A second row for one clientRequestId, or more than one result for a case. Both must be 0.</Plain></p>
          </li>
          <li className="cs-detail">
            <p className="cs-detail-fix">Verdict</p>
            <p className="cs-detail-how"><Plain simple="Consistent, still processing, or something went wrong.">CONSISTENT, PENDING (only OPEN cases remain) or DISCREPANCIES.</Plain></p>
          </li>
        </ul>
        <Placeholder label="Screenshot: the checker's results after a run" />
      </section>

      <Separator className="cs-separator-section" />
      <section>
        <h2 className="typeset-card-title">Breaking It on Purpose</h2>
        <p className="cs-prose">
          <Plain simple="The dashboard can cause trouble on demand, and the checker shows the system recovering from it.">
            Each failure the system claims to survive has a switch on the dashboard, and the checker confirms the
            result.
          </Plain>
        </p>
        <ul className="cs-details-grid">
          <li className="cs-detail">
            <p className="cs-detail-fix"><Plain simple="Double clicks">Duplicate submissions</Plain></p>
            <p className="cs-detail-how"><Plain simple="Up to half the customers send their case twice. Each still ends up as one case, processed once.">Up to 50% of submissions are sent again with the same ID, 0 to 2 s later, sometimes while the first is still in flight. Each still has one case, processed once.</Plain></p>
          </li>
          <li className="cs-detail">
            <p className="cs-detail-fix"><Plain simple="A crash mid-run">Crash or graceful stop</Plain></p>
            <p className="cs-detail-how"><Plain simple="The backend can be stopped politely or crashed outright. After it comes back, every case is accounted for and none is saved twice.">A graceful stop answers every request in progress. A crash leaves them Unknown; the checker shows how many were saved anyway, and that none became a second case after the retry period resent them.</Plain></p>
          </li>
          <li className="cs-detail">
            <p className="cs-detail-fix"><Plain simple="Too busy">Load shedding</Plain></p>
            <p className="cs-detail-how"><Plain simple="When too much is happening at once, the backend says 'try again shortly' straight away, instead of answering slowly.">Over the limit, a filter answers 503 with Retry-After before doing any work: a definite "nothing stored, try later" instead of a slow, uncertain reply.</Plain></p>
          </li>
          <li className="cs-detail">
            <p className="cs-detail-fix"><Plain simple="Slow work">A slow, failing processor</Plain></p>
            <p className="cs-detail-how"><Plain simple="Some cases take ten times longer, and some fail. Neither holds up the others.">1% of cases take 10 s, 2% hit a transient error, 0.1% fail for good. Each case runs on its own virtual thread, and offsets are committed only up to the oldest unfinished case, so a slow case never holds up the rest and a crash redelivers it.</Plain></p>
          </li>
        </ul>
      </section>

      <Separator className="cs-separator-section cs-technical" />
      <section className="cs-technical">
        <h2 className="typeset-card-title">Finding the Ceiling</h2>
        <p className="cs-prose">
          Everything ran on one Windows PC with 20 logical cores: generator, backend, processor, and Kafka and
          PostgreSQL in Docker. The ceiling is the backend's Kafka intake, at about 9,000 to 11,500 accepted
          submissions a second. Above it, the generator skips what doesn't fit and nothing is lost.
        </p>
        <ul className="cs-details-grid">
          {findings.map(({ load, result, detail }) => (
            <li key={load} className="cs-detail">
              <p className="cs-detail-problem typeset-card-toner">{load}</p>
              <p className="cs-detail-fix">{result}</p>
              <p className="cs-detail-how">{detail}</p>
            </li>
          ))}
        </ul>
        <div className="cs-subsection cs-prose">
          <h3 className="typeset-card-title">Why: a Lock in the Producer's Network Thread</h3>
          <p>
            A Java Flight Recorder recording during a 900k run showed the Kafka producer's single network thread
            blocked about a quarter of the time, waiting on a lock inside Java's Windows network selector. Every
            message that starts a new batch wakes that thread, and on Windows the wake-up is a socket write made
            while holding the same lock. Confirmations grew from about 5 ms to 150 ms while Kafka's CPU stayed low.
            Larger batches (25 ms linger, 64 KB) mean fewer wake-ups and gave about 9% more.
          </p>
          <p>
            Ruled out by measurement: Kafka itself (185,528 confirmed writes a second on its own), Docker's port
            forwarding, the producer pattern, downstream work (intake stayed at about 8,700 a second with saving and
            processing paused), more producers or partitions (both slower), and the backend's CPU and GC (3 to 4 of
            20 cores, about 1.5% in GC).
          </p>
        </div>
      </section>

      <Separator className="cs-separator-section cs-technical" />
      <section className="cs-technical">
        <h2 className="typeset-card-title">Deliberately Not Production-Grade</h2>
        <p className="cs-prose">
          One Kafka broker with replication factor 1, one backend instance, everything on one machine, no
          authentication, and connections never closed for being idle. Beyond one machine it would take several
          backend instances behind a load balancer, a Kafka cluster with replication 3 and
          min.insync.replicas=2, more partitions with more consumers, and servers on Linux.
        </p>
      </section>

      </ReadingVersions>
    </CaseStudy>
  );
}
