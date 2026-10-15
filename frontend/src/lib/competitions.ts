export const supportedCompetitions = [
  {
    value: "Campeonato Paraense",
    label: "Campeonato Paraense",
  },
  {
    value:
      "Campeonato Brasileiro Série B",
    label:
      "Campeonato Brasileiro Série B",
  },
] as const;

export type SupportedCompetition =
  (typeof supportedCompetitions)[number]["value"];

export function isSupportedCompetition(
  value: string,
): value is SupportedCompetition {
  return supportedCompetitions.some(
    (competition) =>
      competition.value === value,
  );
}