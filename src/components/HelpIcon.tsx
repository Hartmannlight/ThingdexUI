type HelpIconProps = {
  text: string;
};

export const HelpIcon = ({ text }: HelpIconProps) => {
  // Help text must explain purpose/effect, not just restate the field label.
  return (
    <button type="button" className="help-icon" data-help={text} aria-label={text}>
      ?
    </button>
  );
};
