import { useNavigate } from 'react-router-dom';
import './Terms.css';

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

function Terms() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="terms-nav">
        <button
          className="terms-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <IconChevronLeft />
          <span>Back</span>
        </button>
      </div>

      <header className="terms-header">
        <span className="eyebrow">Legal</span>
        <h1 className="terms-title">SwapHoot Terms of Service</h1>
        <p className="terms-intro">
          Please read these terms carefully. By creating an account you confirm
          you agree to them.
        </p>
      </header>

      <article className="terms-doc">

        <section className="terms-section">
          <h2 className="terms-section-title">1. Acceptance of Terms and Eligibility</h2>
          <p>
            By creating an account and using SwapHoot, you agree to be bound by
            these Terms of Service. You must be at least <strong>18 years old</strong> to
            create an account, access, or use this platform. If you do not
            agree to these terms, you may not use SwapHoot.
          </p>
        </section>

        <section className="terms-section">
          <h2 className="terms-section-title">2. The Nature of Our Service</h2>
          <p>
            SwapHoot provides an online platform designed solely to connect
            local users who wish to trade second-hand items.
          </p>
          <ul className="terms-list">
            <li>SwapHoot does not buy, sell, own, broker, or inspect any items listed on the platform.</li>
            <li>We are not a party to any agreement or transaction made between users.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2 className="terms-section-title">3. Face-to-Face Trading and User Safety</h2>
          <p>
            SwapHoot is built for local, community-based swapping. We strongly
            mandate that all users conduct trades face-to-face.
          </p>
          <p>
            <strong>Assumption of Risk:</strong> You interact with other users
            entirely at your own risk. SwapHoot does not conduct criminal
            background checks or verify the identity of its users.
          </p>
          <p>
            <strong>Safety Protocols:</strong> You agree to prioritize your
            safety when arranging a swap. You must meet in public, well-lit
            areas (such as coffee shops or designated police station safe
            trade zones) and are encouraged to bring a companion.
          </p>
        </section>

        <section className="terms-section">
          <h2 className="terms-section-title">4. Shipping and Remote Trades (Zero Liability)</h2>
          <p>
            While the platform is intended for local meetups, users may
            independently agree to ship items.
          </p>
          <ul className="terms-list">
            <li><strong>At Your Own Risk:</strong> If you choose to ship an item or receive a shipped item, you do so entirely at your own risk.</li>
            <li><strong>No Platform Protection:</strong> SwapHoot offers zero buyer/seller protection, shipping insurance, mediation, or tracking services.</li>
            <li><strong>No Liability:</strong> SwapHoot assumes absolutely no responsibility or liability for items that are lost, damaged, stolen, or misrepresented during a remote or shipped trade. We will not intervene in shipping disputes.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2 className="terms-section-title">5. Prohibited Items</h2>
          <p>
            To ensure community safety and compliance with the law, the
            following items are strictly prohibited from being listed or
            traded on SwapHoot:
          </p>
          <ul className="terms-list">
            <li>Firearms, ammunition, and weapons of any kind.</li>
            <li>Illegal drugs, narcotics, and prescription medications.</li>
            <li>Hazardous materials, chemicals, or explosives.</li>
            <li>Stolen goods or items you do not legally own.</li>
            <li>Counterfeit items or copyright-infringing material.</li>
            <li>Live animals or animal parts.</li>
            <li>Adult content or sexually explicit materials.</li>
            <li>Any item that violates local, state, or national laws.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2 className="terms-section-title">6. User Conduct and Anti-Harassment</h2>
          <p>
            SwapHoot maintains a zero-tolerance policy for abuse. You agree
            not to:
          </p>
          <ul className="terms-list">
            <li>Harass, threaten, or discriminate against any other user.</li>
            <li>Send spam, unsolicited promotions, or phishing links.</li>
            <li>Post false, misleading, or deceptive information regarding your items.</li>
            <li>Use the platform for any illegal activities or to promote violence.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2 className="terms-section-title">7. Intellectual Property and User Content</h2>
          <p>
            <strong>Your Content:</strong> You retain ownership of the photos
            and descriptions you upload. You guarantee that you have the right
            to post these photos and that they are not stolen from other
            sources.
          </p>
          <p>
            <strong>Our License:</strong> By uploading content, you grant
            SwapHoot a non-exclusive, worldwide, royalty-free license to use,
            display, and distribute your photos and descriptions for the
            purpose of operating and promoting the platform.
          </p>
        </section>

        <section className="terms-section">
          <h2 className="terms-section-title">8. Release of Liability</h2>
          <p>
            By using SwapHoot, you acknowledge that interacting with strangers
            and trading goods carries inherent risks.
          </p>
          <p>
            You fully release SwapHoot, its founders, employees, and
            affiliates from any and all claims, demands, and damages (actual
            and consequential) of every kind and nature arising out of or in
            any way connected with disputes between you and other users.
          </p>
          <p>
            We make no warranties regarding the safety, quality, or legality
            of the items traded.
          </p>
        </section>

        <section className="terms-section">
          <h2 className="terms-section-title">9. Account Termination</h2>
          <p>
            SwapHoot reserves the right to suspend or permanently terminate
            your account and your access to the platform at our sole
            discretion, at any time, with or without notice, for any
            violation of these Terms of Service or for any behavior deemed
            harmful to the community.
          </p>
        </section>

      </article>
    </div>
  );
}

export default Terms;
