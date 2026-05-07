export const LastActionBar = ({ text, time }: { text: string; time?: string }) => (
  <div className="last-action">
    <span className="last-action__mark">T</span>
    <strong>Letzte Aktion</strong>
    {time && <span>{time}</span>}
    <span>{text}</span>
  </div>
);
