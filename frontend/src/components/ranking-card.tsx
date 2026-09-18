import type { RankingEntry } from "@/types";

type RankingCardProps = {
  entries: RankingEntry[];
};

export function RankingCard({
  entries,
}: RankingCardProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5">
      <div className="mb-4">
        <h2 className="text-lg font-extrabold">
          Ranking geral
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Charqueons da Resenha
        </p>
      </div>

      <div>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`grid grid-cols-[36px_1fr_auto] items-center gap-3 border-t border-slate-800 px-2 py-3 ${
              entry.isCurrentUser
                ? "rounded-xl bg-lime-400/10"
                : ""
            }`}
          >
            <strong className="text-slate-400">
              {entry.position}
            </strong>

            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-900 text-xs font-bold">
                {entry.initials}
              </span>

              <div>
                <strong className="block text-sm">
                  {entry.name}
                  {entry.isCurrentUser ? " (você)" : ""}
                </strong>

                <span className="text-xs text-slate-500">
                  {entry.exactScores} placares exatos
                </span>
              </div>
            </div>

            <strong className="text-sm">
              {entry.points} pts
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}