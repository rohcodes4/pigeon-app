import { Bell, LogOut, MessageCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { toast } from "@/hooks/use-toast";
import Layout from '@/components/Layout';

const PrivcyPolicy = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      // Check if user has completed onboarding
      const onboardingComplete = localStorage.getItem(`chatpilot_onboarded_${user.id}`);
      if (onboardingComplete) {        
        setIsConnected(true);
      }
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });
  };
  return (
    <Layout>
        <div className='w-full mb-8 bg-white backdrop-blur-sm mt-2 rounded-sm p-4'>
        
  <div className="min-h-screen bg-white text-gray-800 px-6 py-12 w-full mx-auto space-y-8">
    <div>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500">
        <strong>Effective Date:</strong> 12th January, 2025<br />
        <strong>Last Updated:</strong> 12th January, 2025
      </p>
    </div>

    <p>
      At <strong>ChatPilot</strong> (“we,” “our,” or “us”), we take your privacy seriously. This Privacy Policy outlines how we collect, use, and protect your personal data when you use our application (“App”).
    </p>
    <p>By using ChatPilot, you agree to the terms of this policy.</p>

    <section>
      <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>

      <h3 className="text-lg font-semibold mt-4 mb-1">a. Account Information</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Telegram:</strong> We collect your phone number and session authorization (via Telegram’s TDLib) to access your chats and groups.</li>
        <li><strong>Discord:</strong> We collect your Discord user ID, access tokens, and server/group metadata via OAuth.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4 mb-1">b. Chat & Group Data</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>Message content, mentions, reactions, and timestamps</li>
        <li>Group or channel names, participants, and media shared</li>
        <li>Metadata like pinned messages, tags, or roles</li>
      </ul>
      <p className="mt-2">We <strong>only access chats you explicitly sync</strong>.</p>

      <h3 className="text-lg font-semibold mt-4 mb-1">c. Device & Usage Information</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>IP address, device type, and OS</li>
        <li>App usage patterns (e.g., feature engagement, summary frequency)</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">2. How We Use Your Data</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Connect and sync your Telegram and Discord chats</li>
        <li>Provide AI-based summaries and to-do suggestions</li>
        <li>Display personalized insights like top keywords or chat activity</li>
        <li>Notify you of important or time-sensitive messages</li>
        <li>Improve user experience and feature relevance</li>
      </ul>
      <p className="mt-2">
        We <strong>do not</strong> sell your data. We <strong>do not</strong> post, message, or interact with your groups or chats without explicit permission.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">3. How We Store & Protect Your Data</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>All sensitive data is encrypted in transit and at rest.</li>
        <li>Telegram sessions are stored securely and never shared.</li>
        <li>We enforce least-privilege access across our team.</li>
        <li>We regularly audit and monitor our systems for vulnerabilities.</li>
      </ul>
      <p className="mt-2">
        If you choose to delete your account, <strong>all personal and chat data will be permanently deleted</strong> within 30 days.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">4. Third-Party Services</h2>
      <p>
        We use trusted third-party providers (e.g., AWS, Firebase, OpenAI, Telegram, Discord) only for necessary operations. They are contractually obligated to protect your data.
      </p>
      <p className="mt-2">
        We <strong>never</strong> share your identifiable data with advertisers or analytics firms.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">5. Your Rights</h2>
      <p>Depending on your jurisdiction (e.g., EU or California), you may have the right to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Request a copy of your data</li>
        <li>Delete your account and all associated data</li>
        <li>Withdraw consent at any time</li>
        <li>Lodge a complaint with a data protection authority</li>
      </ul>
      <p className="mt-2">
        You can manage data access via the in-app settings or email us at <a href="mailto:rohitparakh4@gmail.com" className="text-blue-600 underline">rohitparakh4@gmail.com</a>.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">6. Children’s Privacy</h2>
      <p>
        Our App is not intended for users under the age of 13. We do not knowingly collect data from children. If you believe a child has provided us with personal data, please contact us, and we will promptly delete it.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">7. Data Retention</h2>
      <p>
        We retain your data only as long as necessary to provide our services. Inactive accounts may be deleted after 12 months of inactivity, with advance notice.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">8. International Transfers</h2>
      <p>
        Your data may be stored and processed in countries outside your residence. We ensure that such transfers comply with applicable privacy laws and are protected by appropriate safeguards.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">9. Updates to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If changes are material, we’ll notify you via email or in-app notice. Continued use of the app constitutes acceptance of the updated policy.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">10. Contact Us</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy, please contact us at:<br />
        📧 <a href="mailto:rohitparakh4@gmail.com" className="text-blue-600 underline">rohitparakh4@gmail.com</a>
      </p>
    </section>
  </div>


            </div>
    </Layout>
  )
}

export default PrivcyPolicy