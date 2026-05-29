export default function EnglishRefundPage() {
  return (
    <main className="min-h-screen bg-[#0b1120] px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-10 text-4xl font-bold">Refund Policy</h1>

        <div className="space-y-8 text-lg leading-8 text-white/80">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              1. General information
            </h2>
            <p>
              This Refund Policy defines the conditions under which AI SMM Studio reviews
              requests for refunds of payments or credits.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              2. Digital nature of the services
            </h2>
            <p>
              The services in the platform represent digital content and AI-generated materials
              that begin processing immediately after a user request.
            </p>
            <p>
              Because of this, used credits and already started generations are not refundable,
              except in cases of a proven technical issue caused by the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              3. When a refund may be reviewed
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>if a paid service was not provided due to a technical reason</li>
              <li>if credits were charged but the generation did not start</li>
              <li>if there is a proven system issue caused by the platform</li>
              <li>if an incorrect amount was charged due to a technical reason</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              4. When refunds are not offered
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>for already used credits</li>
              <li>for successfully generated content</li>
              <li>if the result does not match subjective expectations</li>
              <li>if incorrect information was entered by the user</li>
              <li>if the user changes their decision after purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              5. Technical issues
            </h2>
            <p>
              In case of a technical issue, the user can contact us through the contact form
              on the website. The request will be reviewed and, if the issue is confirmed,
              the platform may offer a credit refund, repeated generation or another suitable solution.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              6. Review period
            </h2>
            <p>
              Refund requests are reviewed within a reasonable period. Response time may depend
              on the complexity of the specific case.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              7. Contact
            </h2>
            <p>
              For questions about payments, credits or refunds, you can contact us through
              the contact form on the website.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
