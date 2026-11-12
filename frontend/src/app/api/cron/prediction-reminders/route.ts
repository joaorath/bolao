import {
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { NextResponse } from "next/server";

import {
  sendPredictionReminder,
} from "@/lib/email/brevo";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export const maxDuration = 25;

const CLAIM_LIMIT = 50;

function isAuthorized(
  request: Request,
) {
  const expectedSecret =
    process.env
      .PREDICTION_REMINDER_SECRET;

  const authorization =
    request.headers.get(
      "authorization",
    );

  const providedSecret =
    authorization?.startsWith(
      "Bearer ",
    )
      ? authorization.slice(7)
      : "";

  if (
    !expectedSecret ||
    !providedSecret
  ) {
    return false;
  }

  const expectedBuffer =
    Buffer.from(expectedSecret);

  const providedBuffer =
    Buffer.from(providedSecret);

  if (
    expectedBuffer.length !==
    providedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    providedBuffer,
  );
}

function getErrorMessage(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido durante o envio.";
}

export async function POST(
  request: Request,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      },
    );
  }

  const requestUrl =
    new URL(request.url);

    const testMode =
        requestUrl.searchParams.get(
            "test",
        ) === "true";

    if (testMode) {
        const testEmail =
            process.env
            .PREDICTION_REMINDER_TEST_EMAIL
            ?.trim();

        if (!testEmail) {
            return NextResponse.json(
            {
                error:
                "PREDICTION_REMINDER_TEST_EMAIL não foi configurada.",
            },
            {
                status: 400,
            },
            );
        }

        try {
            const result =
            await sendPredictionReminder({
                deliveryId:
                randomUUID(),

                recipientEmail:
                testEmail,

                recipientName:
                "João",

                poolId:
                "4675f738-6adc-45e9-b939-e98a1f729d3f",

                poolName:
                "Homologação Série B",

                poolIsGlobal:
                false,

                competition:
                "Teste de lembrete",

                round: 1,

                startsAt:
                new Date(
                    Date.now() +
                    30 *
                        60 *
                        1000,
                ).toISOString(),

                homeTeamName:
                "Clube do Remo",

                awayTeamName:
                "Paysandu",
            });

            return NextResponse.json({
            test: true,
            sent: true,
            messageId:
                result.messageId,
            });
    } catch (error) {
        const errorMessage =
        getErrorMessage(
            error,
        ).slice(
            0,
            1000,
        );

        console.error(
        "Erro no envio de teste:",
        errorMessage,
        );

        return NextResponse.json(
        {
            test: true,
            sent: false,
            error:
            errorMessage,
        },
        {
            status: 502,
        },
        );
    }
    }

  const supabase =
    createAdminClient();

  const {
    data,
    error: claimError,
  } = await supabase.rpc(
    "claim_due_prediction_email_reminders_v2",
    {
      claim_limit:
        CLAIM_LIMIT,
    },
  );

  if (claimError) {
    console.error(
      "Erro ao reservar lembretes:",
      claimError,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível reservar os lembretes.",
      },
      {
        status: 500,
      },
    );
  }

  const reminders =
    data ?? [];

  if (reminders.length === 0) {
    return NextResponse.json({
      processed: 0,
      sent: 0,
      failed: 0,
      message:
        "Nenhum lembrete pendente nesta execução.",
    });
  }

  const results =
    await Promise.all(
      reminders.map(
        async (reminder) => {
          try {
            const result =
              await sendPredictionReminder({
                deliveryId:
                  reminder.delivery_id,

                recipientEmail:
                  reminder.recipient_email,

                recipientName:
                  reminder.recipient_name,

                poolId:
                    reminder.pool_id,

                    poolName:
                    reminder.pool_name,

                    poolIsGlobal:
                    reminder.pool_is_global,

                competition:
                  reminder.competition,

                round:
                  reminder.round,

                startsAt:
                  reminder.starts_at,

                homeTeamName:
                  reminder.home_team_name,

                awayTeamName:
                  reminder.away_team_name,
              });

            const sentAt =
              new Date().toISOString();

            const {
              error: updateError,
            } = await supabase
              .from(
                "prediction_email_reminder_deliveries",
              )
              .update({
                status: "SENT",
                sent_at: sentAt,
                provider_message_id:
                  result.messageId,
                last_error: null,
                updated_at: sentAt,
              })
              .eq(
                "id",
                reminder.delivery_id,
              );

            if (updateError) {
              throw new Error(
                `O e-mail foi aceito pelo Brevo, mas o registro não foi atualizado: ${updateError.message}`,
              );
            }

            return {
              success: true,
              deliveryId:
                reminder.delivery_id,
            };
          } catch (error) {
            const errorMessage =
              getErrorMessage(
                error,
              ).slice(
                0,
                1000,
              );

            console.error(
              "Erro ao enviar lembrete:",
              {
                deliveryId:
                  reminder.delivery_id,
                matchId:
                  reminder.match_id,
                error:
                  errorMessage,
              },
            );

            const failedAt =
              new Date().toISOString();

            const {
              error:
                failureUpdateError,
            } = await supabase
              .from(
                "prediction_email_reminder_deliveries",
              )
              .update({
                status: "FAILED",
                last_error:
                  errorMessage,
                updated_at:
                  failedAt,
              })
              .eq(
                "id",
                reminder.delivery_id,
              );

            if (
              failureUpdateError
            ) {
              console.error(
                "Erro ao registrar falha do lembrete:",
                {
                  deliveryId:
                    reminder.delivery_id,
                  error:
                    failureUpdateError,
                },
              );
            }

            return {
              success: false,
              deliveryId:
                reminder.delivery_id,
            };
          }
        },
      ),
    );

  const sentCount =
    results.filter(
      (result) =>
        result.success,
    ).length;

  const failedCount =
    results.length -
    sentCount;

  return NextResponse.json({
    processed:
      results.length,
    sent:
      sentCount,
    failed:
      failedCount,
  });
}