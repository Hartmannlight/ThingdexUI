type NextScanHintProps = {
  lines: Array<{ when: string; then: string }>;
  actionLabel?: string;
};

export const NextScanHint = ({ lines, actionLabel = "Nächster Scan" }: NextScanHintProps) => (
  <section className="next-scan">
    <div className="next-scan__title">
      <span className="next-scan__mark">[]</span>
      {actionLabel}
    </div>
    <div className="next-scan__rules">
      {lines.map((line) => (
        <div className="next-scan__rule" key={`${line.when}-${line.then}`}>
          <span>{line.when}</span>
          <span aria-hidden="true">-&gt;</span>
          <strong>{line.then}</strong>
        </div>
      ))}
    </div>
  </section>
);
