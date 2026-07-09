// app/privacy/page.tsx

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">
        Privacy Policy
      </h1>

      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: July 9, 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            1. Overview
          </h2>
          <p className="mt-2">
            DocuVocab helps users save notes, words, phrases, and important
            information from webpages. This Privacy Policy explains what
            information we collect, how we use it, and how users can manage
            their data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            2. Information We Collect
          </h2>
          <p className="mt-2">We may collect the following information:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Account information, such as email address, when you sign in.</li>
            <li>Text, words, phrases, notes, and meanings that you choose to save.</li>
            <li>Webpage URL or hostname related to saved notes.</li>
            <li>Basic technical information needed to operate the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            3. How We Use Information
          </h2>
          <p className="mt-2">We use collected information to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Save and synchronize your notes and vocabulary.</li>
            <li>Highlight previously saved items when you revisit webpages.</li>
            <li>Provide access to your DocuVocab workspace.</li>
            <li>Improve reliability, security, and user experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            4. Data Sharing
          </h2>
          <p className="mt-2">
            We do not sell your personal data. We may use trusted service
            providers, such as hosting, database, and authentication providers,
            only as necessary to operate DocuVocab.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            5. Chrome Extension Data
          </h2>
          <p className="mt-2">
            The DocuVocab Chrome extension reads selected text only when you
            choose to save it. The extension may send saved text, notes, and the
            related page URL or hostname to the DocuVocab backend so your notes
            can be synchronized and highlighted later.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            6. Data Retention and Deletion
          </h2>
          <p className="mt-2">
            Your saved notes and vocabulary are kept until you delete them or
            request account deletion. You may request deletion of your data by
            contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            7. Security
          </h2>
          <p className="mt-2">
            We take reasonable measures to protect user data. However, no online
            service can guarantee complete security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-950">
            8. Contact
          </h2>
          <p className="mt-2">
            If you have questions about this Privacy Policy or want to request
            data deletion, contact us at:
          </p>
          <p className="mt-2 font-medium text-slate-950">
            your-email@example.com
          </p>
        </section>
      </div>
    </main>
  );
}