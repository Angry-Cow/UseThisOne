export type FooterLink = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type FooterLinksProps = {
  title: string;
  links: FooterLink[];
};

export const FooterLinks = (props: FooterLinksProps) => {
  return (
    <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
      <h5 className="text-amber-600 font-bold box-border caret-transparent mb-6">
        <span className="box-border caret-transparent">{props.title}</span>
      </h5>
      <ul className="text-white/60 box-border caret-transparent list-none pl-0">
        {props.links.map((link, index) => (
          <li
            key={index}
            className={`box-border caret-transparent${index > 0 ? " mt-4" : ""}`}
          >
            {link.onClick ? (
              <button
                onClick={link.onClick}
                className="box-border caret-transparent hover:text-white bg-transparent border-0 p-0 text-white/60 hover:text-white cursor-pointer text-sm"
              >
                <span className="box-border caret-transparent">{link.label}</span>
              </button>
            ) : (
              <a
                href={link.href}
                className="box-border caret-transparent hover:text-white"
              >
                <span className="box-border caret-transparent">{link.label}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
