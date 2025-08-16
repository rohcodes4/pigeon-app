import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Bot,
  BookOpen,
  Settings,
  Users,
  CheckSquare,
  HelpCircle,
  ExternalLink,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const Help = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    if (user) {
      // Check if user has completed onboarding
      const onboardingComplete = localStorage.getItem(
        `chatpilot_onboarded_${user.id}`
      );
      if (onboardingComplete) {
        setIsConnected(true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const toggleFaq = (faqId: string) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [faqId]: !prev[faqId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <HelpCircle className="w-20 h-20 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const faqs = [
    {
      id: "connect-accounts",
      question: "How do I connect my accounts?",
      answer:
        "Use the OAuth buttons in the sidebar to connect your Telegram and Discord accounts. ChatPilot will only access the conversations you authorize.",
    },
    {
      id: "data-security",
      question: "Is my data secure?",
      answer:
        "Yes! ChatPilot acts as a utility layer on top of your existing accounts. We don't store your messages permanently and use secure OAuth connections.",
    },
    {
      id: "ai-summarization",
      question: "How does AI summarization work?",
      answer:
        "Our AI analyzes your conversations to identify key topics, extract tasks, and provide concise summaries. You can customize what gets extracted.",
    },
    {
      id: "export-data",
      question: "Can I export my data?",
      answer:
        "Yes, you can export your bookmarks, tasks, and summaries. Your original messages remain in your Telegram and Discord accounts.",
    },
  ];

  return (
    <Layout>
      <div className="flex justify-center flex-col p-6 bg-gradient-to-br from-[#171717] via-[#1a1a1a] to-[#171717] min-h-screen w-full">
        <div className="max-w-7xl block mx-auto w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-6 py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#3474ff] to-[#7B5CFA] rounded-full blur-3xl opacity-20"></div>
              <HelpCircle className="relative w-16 h-16 mx-auto text-[#3474ff] mb-4" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-[#d0d0d0] bg-clip-text text-transparent">
              Help & Support
            </h1>
            <p className="text-[#ffffff72] text-xl max-w-2xl mx-auto leading-relaxed">
              Get help with ChatPilot and learn how to make the most of your
              AI-powered communication experience
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-[#212121] to-[#1a1a1a] border-[#333] hover:border-[#3474ff] transition-all duration-300 hover:shadow-lg hover:shadow-[#3474ff]/20 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white group-hover:text-[#3474ff] transition-colors">
                  <div className="p-2 rounded-lg bg-[#3474ff]/10 group-hover:bg-[#3474ff]/20 transition-colors">
                    <MessageCircle className="w-5 h-5 text-[#3474ff]" />
                  </div>
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#ffffff72] text-sm leading-relaxed">
                  Learn the basics of ChatPilot and how to connect your accounts
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="w-full bg-transparent border-[#3474ff] text-[#3474ff] hover:bg-[#3474ff] hover:text-white transition-all"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#212121] to-[#1a1a1a] border-[#333] hover:border-[#7B5CFA] transition-all duration-300 hover:shadow-lg hover:shadow-[#7B5CFA]/20 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white group-hover:text-[#7B5CFA] transition-colors">
                  <div className="p-2 rounded-lg bg-[#7B5CFA]/10 group-hover:bg-[#7B5CFA]/20 transition-colors">
                    <Bot className="w-5 h-5 text-[#7B5CFA]" />
                  </div>
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#ffffff72] text-sm leading-relaxed">
                  Discover AI-powered chat summarization and intelligent task
                  extraction
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/smart-tasks")}
                  className="w-full bg-transparent border-[#7B5CFA] text-[#7B5CFA] hover:bg-[#7B5CFA] hover:text-white transition-all"
                >
                  View Smart Tasks
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#212121] to-[#1a1a1a] border-[#333] hover:border-[#84afff] transition-all duration-300 hover:shadow-lg hover:shadow-[#84afff]/20 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white group-hover:text-[#84afff] transition-colors">
                  <div className="p-2 rounded-lg bg-[#84afff]/10 group-hover:bg-[#84afff]/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-[#84afff]" />
                  </div>
                  Bookmarks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#ffffff72] text-sm leading-relaxed">
                  Save and organize important messages and conversations for
                  easy access
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/bookmarks")}
                  className="w-full bg-transparent border-[#84afff] text-[#84afff] hover:bg-[#84afff] hover:text-white transition-all"
                >
                  View Bookmarks
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Guide */}
          <Card className="bg-gradient-to-br from-[#212121] via-[#1f1f1f] to-[#1a1a1a] border-[#333] hover:border-[#444] transition-all duration-300">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#3474ff] to-[#7B5CFA] text-white">
                  <Settings className="w-6 h-6" />
                </div>
                Key Features
              </CardTitle>
              <p className="text-[#ffffff72] text-sm">
                Discover what makes ChatPilot your ultimate communication
                companion
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-[#3474ff]/10 to-[#3474ff]/5 border border-[#3474ff]/20 hover:border-[#3474ff]/40 transition-all duration-300 group">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-3 group-hover:text-[#3474ff] transition-colors">
                    <div className="p-2 rounded-lg bg-[#3474ff]/20 group-hover:bg-[#3474ff]/30 transition-colors">
                      <MessageCircle className="w-5 h-5 text-[#3474ff]" />
                    </div>
                    Unified Inbox
                  </h3>
                  <p className="text-[#ffffff72] text-sm leading-relaxed">
                    Connect your Telegram and Discord accounts to view all
                    conversations in one place. ChatPilot acts as a utility
                    layer on top of your existing accounts.
                  </p>
                </div>

                <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-[#7B5CFA]/10 to-[#7B5CFA]/5 border border-[#7B5CFA]/20 hover:border-[#7B5CFA]/40 transition-all duration-300 group">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-3 group-hover:text-[#7B5CFA] transition-colors">
                    <div className="p-2 rounded-lg bg-[#7B5CFA]/20 group-hover:bg-[#7B5CFA]/30 transition-colors">
                      <Bot className="w-5 h-5 text-[#7B5CFA]" />
                    </div>
                    AI Summarization
                  </h3>
                  <p className="text-[#ffffff72] text-sm leading-relaxed">
                    Get intelligent summaries of your conversations, extract
                    tasks automatically, and generate insights from your chat
                    history.
                  </p>
                </div>

                <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-[#84afff]/10 to-[#84afff]/5 border border-[#84afff]/20 hover:border-[#84afff]/40 transition-all duration-300 group">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-3 group-hover:text-[#84afff] transition-colors">
                    <div className="p-2 rounded-lg bg-[#84afff]/20 group-hover:bg-[#84afff]/30 transition-colors">
                      <CheckSquare className="w-5 h-5 text-[#84afff]" />
                    </div>
                    Smart Tasks
                  </h3>
                  <p className="text-[#ffffff72] text-sm leading-relaxed">
                    Automatically extract actionable tasks from your
                    conversations and organize them with priorities and tags.
                  </p>
                </div>

                <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-[#ffffff]/10 to-[#ffffff]/5 border border-[#ffffff]/20 hover:border-[#ffffff]/40 transition-all duration-300 group">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-3 group-hover:text-[#ffffff] transition-colors">
                    <div className="p-2 rounded-lg bg-[#ffffff]/20 group-hover:bg-[#ffffff]/30 transition-colors">
                      <Users className="w-5 h-5 text-[#ffffff]" />
                    </div>
                    Contact Management
                  </h3>
                  <p className="text-[#ffffff72] text-sm leading-relaxed">
                    Keep track of your contacts across platforms and manage
                    important relationships and conversations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="bg-gradient-to-br from-[#212121] via-[#1f1f1f] to-[#1a1a1a] border-[#333] hover:border-[#444] transition-all duration-300">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#3474ff] to-[#7B5CFA] text-white">
                  <HelpCircle className="w-6 h-6" />
                </div>
                Frequently Asked Questions
              </CardTitle>
              <p className="text-[#ffffff72] text-sm">
                Find answers to common questions about ChatPilot
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="rounded-xl bg-gradient-to-r from-[#2A2D36] to-[#252832] border border-[#333] hover:border-[#444] transition-all duration-300 overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-[#2A2D36] hover:to-[#2f3239] p-4 transition-all duration-300"
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <h4 className="font-semibold text-white text-base">
                        {faq.question}
                      </h4>
                      <div className="flex-shrink-0 ml-4">
                        {expandedFaqs[faq.id] ? (
                          <ChevronUp className="w-5 h-5 text-[#3474ff] transition-colors" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#ffffff72] hover:text-[#3474ff] transition-colors" />
                        )}
                      </div>
                    </div>
                    {expandedFaqs[faq.id] && (
                      <div className="px-4 pb-4 border-t border-[#333]">
                        <div className="pt-4">
                          <p className="text-[#ffffff72] text-sm leading-relaxed bg-gradient-to-r from-[#212121] to-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support & Contact */}
          <Card className="bg-gradient-to-br from-[#212121] via-[#1f1f1f] to-[#1a1a1a] border-[#333] hover:border-[#444] transition-all duration-300">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#3474ff] to-[#7B5CFA] text-white">
                  <Mail className="w-6 h-6" />
                </div>
                Need More Help?
              </CardTitle>
              <p className="text-[#ffffff72] text-sm">
                Our support team is here to help you get the most out of
                ChatPilot
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="w-full max-w-md justify-center gap-3 py-6 bg-gradient-to-r from-[#3474ff] to-[#7B5CFA] text-white border-none hover:from-[#2563eb] hover:to-[#6d28d9] transition-all duration-300 text-base font-semibold shadow-lg hover:shadow-xl hover:shadow-[#3474ff]/20"
                  onClick={() =>
                    window.open("mailto:support@chatpilot.ai", "_blank")
                  }
                >
                  <Mail className="w-5 h-5" />
                  Contact Support Team
                </Button>
              </div>

              <div className="text-center pt-4 space-y-2">
                <p className="text-[#ffffff72] text-sm leading-relaxed">
                  For urgent issues, please contact our support team directly
                </p>
                <p className="text-[#ffffff48] text-xs">
                  We typically respond within 24 hours during business days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Help;
