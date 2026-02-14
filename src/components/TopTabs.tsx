import { Link, useLocation } from "react-router-dom";

type Props = {
  title?: string;
  statusText?: string;
  onShowScores?: () => void;
};

export default function TopTabs({
  title = "Genshin Dummy Guesser",
  statusText,
  onShowScores,
}: Props) {
  const { pathname } = useLocation();

  const isGame = pathname === "/";
  const isEndless = pathname === "/endless";
  const isSubmit = pathname === "/submit";
  const isRoadmap = pathname === "/roadmap";

  const tabClasses = (active: boolean): string =>
    `w-[110px] ${active ? "h-10 text-white bg-[#2a2a2a]" : "h-[35px] text-gray-300 bg-[#1f1f1f]"} inline-flex items-center justify-center font-bold text-[0.95rem] no-underline border-b border-l border-r border-[#444] rounded-b-2xl`;

  return (
    <div className="mb-8 ml-8">
      <div className="flex gap-8 items-start">
        <Link to="/" className="no-underline text-inherit">
          <h2 className="m-0">{title}</h2>
        </Link>
        <div className="flex gap-3">
          <Link to="/" className={tabClasses(isGame)}>
            Daily
          </Link>
          <Link to="/endless" className={tabClasses(isEndless)}>
            Endless
          </Link>
          <Link to="/submit" className={tabClasses(isSubmit)}>
            Submit
          </Link>
          <Link to="/roadmap" className={tabClasses(isRoadmap)}>
            Roadmap
          </Link>
          {onShowScores ? (
            <button type="button" onClick={onShowScores} className={tabClasses(false)}>
              Scores
            </button>
          ) : null}
        </div>
        <div className="mt-1.5 text-xs opacity-65">
          Made by{" "}
          <a
            href="https://www.youtube.com/c/Watchful"
            target="_blank"
            rel="noopener noreferrer"
            className="text-inherit underline"
          >
            Watchful
          </a>
          <text> | Version 0.8</text>
          <br></br>
          <text>Conceptualised by </text>
          <a
            href="https://www.twitch.tv/zajef77"
            target="_blank"
            rel="noopener noreferrer"
            className="text-inherit underline"
          >
            Zajef77
          </a>
          <text> and Virus34</text>
        </div>

        {statusText && (
          <div className="flex-1 text-center text-[1.4rem] font-bold text-inherit">
            {statusText}
          </div>
        )}
      </div>
    </div>
  );
}
