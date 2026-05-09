export interface FetchedEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
}

export type EmailListItem = {
  id: string;
  sender: string;
  subject: string;
  receivedAt: string;
  parsed: number;
};

export type ParseResult = {
  processed: number;
  transactionsAdded: number;
  skipped: { emailId: string; subject: string; reason: string }[];
  errors: { emailId: string; subject: string; error: string }[];
};
