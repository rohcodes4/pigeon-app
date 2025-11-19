import React, { useState, useEffect } from "react";
import { Heart, X, MessageCircle } from "lucide-react";
import { FaTelegramPlane, FaDiscord } from "react-icons/fa";
import { deleteBookmark } from "@/utils/apiHelpers";
import { toast } from "@/hooks/use-toast";
import { mapToFullChat } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// API function to fetch favorite messages (bookmarks with type "bookmark")
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const fetchFavoriteMessages = async () => {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${BACKEND_URL}/bookmarks?type=bookmark`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.status}`);
  }

  return response.json();
};

const FavoritesPanel = () => {
  const [favoriteMessages, setFavoriteMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  // Load favorite messages on component mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchFavoriteMessages();
        setFavoriteMessages(data);
        console.log("Loaded favorite messages:", data);
      } catch (error) {
        console.error("Error loading favorites:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load favorites"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (bookmarkId: string) => {
    try {
      await deleteBookmark(bookmarkId);

      // Remove from local state
      setFavoriteMessages((prev) =>
        prev.filter((fav) => fav.id !== bookmarkId)
      );

      toast({
        title: "Favorite removed",
        description: "Message removed from favorites",
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({
        title: "Error",
        description: "Failed to remove favorite. Please try again.",
        variant: "destructive",
      });
    }
  };

   const handleJump = (msg)=>{
      msg.photo_url = msg.chat_id
      ? `${BACKEND_URL}/chat_photo/${msg.chat_id}`
      : `https://www.gravatar.com/avatar/${
          msg.sender?.id || "example"
        }?s=80`;
      navigate("/", { state: { selectedChat: mapToFullChat(msg), selectedMessageId:msg.id } });
      
    }
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <aside className="h-[calc(100vh-60px)] flex-1 overflow-y-scroll overflow-x-hidden min-w-[400px] 2xl:min-w-[500px] bg-[#111111] text-white flex flex-col shadow-lg border border-[#23242a]">
        <div className="text-[#84AFFF] flex items-center gap-2 p-4">
          <Heart className="w-4 h-4 fill-[#84AFFF]" />
          <span>Favorite Messages</span>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-[#fafafa60]">Loading favorites...</div>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="h-[calc(100vh-60px)] flex-1 overflow-y-scroll overflow-x-hidden min-w-[400px] 2xl:min-w-[500px] bg-[#111111] text-white flex flex-col shadow-lg border border-[#23242a]">
        <div className="text-[#84AFFF] flex items-center gap-2 p-4">
          <Heart className="w-4 h-4 fill-[#84AFFF]" />
          <span>Favorite Messages</span>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </aside>
    );
  }
// console.log('favoriteMessages',favoriteMessages)
  return (
    <aside className="h-[calc(100vh-60px)] flex-1 overflow-y-scroll overflow-x-hidden min-w-[400px] 2xl:min-w-[500px] bg-[#111111] text-white flex flex-col shadow-lg border border-[#23242a]">
      <div className="text-[#84AFFF] flex items-center gap-2 p-4">
        <Heart className="w-4 h-4 fill-[#84AFFF]" />
        <span>Favorite Messages ({favoriteMessages.length})</span>
      </div>

      {favoriteMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-[#fafafa60] text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>No favorite messages yet</div>
            <div className="text-xs mt-1">
              Save messages to favorites to see them here
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-3 mb-2" >
          {favoriteMessages.map((favorite) => (
            <div
              key={favorite.created_at}
              className="relative bg-[#212121] p-3 rounded-[10px] border border-[#ffffff09]"
               onClick={() => handleJump(favorite)}
            >
              <div
                className="absolute top-2 right-2 cursor-pointer"
                onClick={() => handleRemoveFavorite(favorite.id)}
              >
                <X className="w-4 h-4 text-[#fafafa60] hover:text-[#fafafa]" />
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#84AFFF]" />
                </div>

                <div className="grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-[#fafafa] font-medium">
                      Favorite Message
                    </span>
                    <span className="text-xs text-[#FAFAFA60]">
                      {formatDate(favorite.created_at)}
                    </span>
                    <Heart className="w-3 h-3 text-[#84AFFF] fill-[#84AFFF]" />
                  </div>

                  <div className="text-sm text-[#fafafa] break-words w-full mb-2">
                    {favorite.text || "No text available"}
                  </div>

                  <div className="flex space-x-2">
                    <span className="text-xs rounded-full bg-[#ffffff16] px-2 py-1">
                      💬 Chat {favorite.chat_id}
                    </span>
                    <span className="text-xs rounded-full bg-[#ffffff16] px-2 py-1">
                      ❤️ Favorited
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default FavoritesPanel;
