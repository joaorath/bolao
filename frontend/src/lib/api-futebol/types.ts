export type ApiFutebolChampionship = {
  campeonato_id: number;
  nome: string;
  slug: string;
};

export type ApiFutebolTeam = {
  time_id: number;
  nome_popular: string;
  sigla: string;
  escudo: string | null;
};

export type ApiFutebolStadium = {
  estadio_id: number;
  nome_popular: string;
};

export type ApiFutebolMatch = {
  partida_id: number;
  campeonato: ApiFutebolChampionship;
  placar: string;
  time_mandante: ApiFutebolTeam;
  time_visitante: ApiFutebolTeam;
  placar_mandante: number | null;
  placar_visitante: number | null;
  disputa_penalti: boolean;
  status: string;
  cronometro: number | string | null;
  periodo: string | null;
  slug: string;
  data_realizacao: string;
  hora_realizacao: string;
  data_realizacao_iso: string;
  estadio: ApiFutebolStadium | null;
  _link: string;
};

export type ApiFutebolRoundReference = {
  nome?: string;
  slug?: string;
  rodada?: number;
  status?: string;
  _link?: string;
};

export type ApiFutebolRound = {
  nome: string;
  slug: string;
  rodada: number;
  status: string;
  partidas: ApiFutebolMatch[];
  rodada_anterior:
    | ApiFutebolRoundReference
    | null;
  proxima_rodada:
    | ApiFutebolRoundReference
    | null;
  _link: string;
};