"use client";

import {
  deletePool,
  leavePool,
} from "@/app/boloes/actions";

type PoolCardActionsProps = {
  poolId: string;
  poolName: string;
  isOwner: boolean;
};

export function PoolCardActions({
  poolId,
  poolName,
  isOwner,
}: PoolCardActionsProps) {
  const action = isOwner
    ? deletePool
    : leavePool;

  function confirmAction(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    const message = isOwner
      ? `Tem certeza de que deseja excluir o bolão "${poolName}"?`
      : `Tem certeza de que deseja sair do bolão "${poolName}"?`;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={action}
      onSubmit={confirmAction}
    >
      <input
        type="hidden"
        name="poolId"
        value={poolId}
      />

      <button
        type="submit"
        className="h-full rounded-xl border border-red-400/30 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-400/10"
      >
        {isOwner ? "Excluir" : "Sair"}
      </button>
    </form>
  );
}