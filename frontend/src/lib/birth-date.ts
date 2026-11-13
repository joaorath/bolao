const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const BRAZILIAN_DATE_PATTERN =
  /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function formatBirthDateInput(
  value: string,
) {
  const trimmedValue = value.trim();

  if (
    ISO_DATE_PATTERN.test(trimmedValue)
  ) {
    const [year, month, day] =
      trimmedValue.split("-");

    return `${day}/${month}/${year}`;
  }

  const digits = trimmedValue
    .replace(/\D/g, "")
    .slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(
      0,
      2,
    )}/${digits.slice(2)}`;
  }

  return `${digits.slice(
    0,
    2,
  )}/${digits.slice(
    2,
    4,
  )}/${digits.slice(4)}`;
}

export function normalizeBirthDate(
  value: string,
) {
  const trimmedValue = value.trim();

  if (
    ISO_DATE_PATTERN.test(trimmedValue)
  ) {
    return trimmedValue;
  }

  const match =
    BRAZILIAN_DATE_PATTERN.exec(
      trimmedValue,
    );

  if (!match) {
    return trimmedValue;
  }

  const [, day, month, year] = match;

  return `${year}-${month}-${day}`;
}

function getTodayInBelem() {
  const parts =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Belem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year",
  )?.value;

  const month = parts.find(
    (part) => part.type === "month",
  )?.value;

  const day = parts.find(
    (part) => part.type === "day",
  )?.value;

  return `${year}-${month}-${day}`;
}

export function isValidBirthDate(
  value: string,
) {
  const normalizedValue =
    normalizeBirthDate(value);

  if (
    !ISO_DATE_PATTERN.test(
      normalizedValue,
    )
  ) {
    return false;
  }

  const parsedDate = new Date(
    `${normalizedValue}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate
      .toISOString()
      .slice(0, 10) !== normalizedValue
  ) {
    return false;
  }

  const today = getTodayInBelem();

  return (
    normalizedValue >= "1900-01-01" &&
    normalizedValue <= today
  );
}