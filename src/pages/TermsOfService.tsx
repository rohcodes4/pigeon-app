import { Bell, LogOut, MessageCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { toast } from "@/hooks/use-toast";
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
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
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500">
        <strong>Effective Date:</strong> 12th January, 2025<br />
        <strong>Last Updated:</strong> 12th January, 2025
      </p>
    </div>

    <p>
      Welcome to <strong>ChatPilot</strong> (“we,” “our,” or “us”). These Terms of Service (“Terms”) govern your use of our application (“App”), which helps users summarize and manage conversations from Telegram, Discord, and other messaging platforms. By using the App, you agree to these Terms.
    </p>

    <section>
      <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
      <p>
        By creating an account or using the App in any way, you agree to be bound by these Terms and our <Link to="/privacy-policy" className="text-blue-600 underline">Privacy Policy</Link>. If you do not agree, please do not use the App.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">2. Description of Service</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Connect your Telegram and Discord accounts</li>
        <li>Access, organize, and summarize chat content</li>
        <li>Generate insights, track to-dos, and manage tasks</li>
        <li>Receive notifications and content-based alerts</li>
      </ul>
      <p className="mt-2">
        We act only as an interface and utility layer on top of your own Telegram and Discord accounts. You retain full ownership and responsibility for your accounts.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">3. Account and Login Information</h2>
      <p>
        To use the App, you must log in with your <strong>Telegram phone number and OTP</strong> or authorize access via <strong>Discord OAuth</strong>.
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Login to Telegram is handled directly within the App using the official Telegram Client API (TDLib/MTProto).</li>
        <li>We do not send messages or take action on your behalf without explicit permission.</li>
        <li>We do not store your Telegram password or access your account beyond what is needed for summarization and analytics.</li>
        <li>You are solely responsible for maintaining the confidentiality of your account and all activity under your account.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">4. Data Access and Usage</h2>
      <p>With your consent, we access and process:</p>
      <ul className="list-disc pl-6 space-y-1 mt-1">
        <li>Chat messages, group metadata, and media files</li>
        <li>Mentions, reactions, timestamps, and group behavior patterns</li>
      </ul>
      <p className="mt-2">We use this data to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Summarize conversations</li>
        <li>Surface relevant content</li>
        <li>Help you stay up-to-date and organized</li>
      </ul>
      <p className="mt-2">All processing is done securely. We never sell or share your data with third parties.</p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">5. User Conduct</h2>
      <p>You agree not to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Use the App for any unlawful, abusive, or fraudulent purpose</li>
        <li>Attempt to access data of other users without authorization</li>
        <li>Reverse-engineer, duplicate, or exploit the App’s software</li>
        <li>Misrepresent yourself or impersonate others</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">6. Unofficial Telegram Client Disclaimer</h2>
      <p>
        ChatPilot is an <strong>unofficial application</strong> and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Telegram Messenger LLP or Discord Inc.
      </p>
      <p className="mt-2">
        Telegram and Discord logos, names, and trademarks belong to their respective owners. Use of the Telegram Client API is done in accordance with <a href="https://my.telegram.org/auth" target="_blank" className="text-blue-600 underline">Telegram’s Terms</a> and licensing requirements.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">7. Modifications and Updates</h2>
      <p>
        We may modify these Terms at any time. Changes will be notified via email or in-app. Your continued use of the App after such changes constitutes your acceptance of the new Terms.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">8. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your account at any time for violating these Terms or engaging in suspicious activity.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">9. Disclaimer and Limitation of Liability</h2>
      <p>
        The App is provided “as is” without warranties of any kind. We do not guarantee message accuracy, delivery, or the completeness of summaries. We are not responsible for loss of data or damages arising from App usage.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-2">10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of <span className="italic">Chennai, Tamil Nadu, India</span>. Any legal action will be brought in the courts of <span className="italic">Chennai, Tamil Nadu, India</span>.
      </p>
    </section>
  </div>


            </div>
    </Layout>
  )
}

export default TermsOfService