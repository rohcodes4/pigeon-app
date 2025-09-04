import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, Filter, Pin, Search, X, Plus, Trash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AppHeaderProps = {
  title?: string;
  setIsNotificationPanel?: (value: boolean) => void;
  isNotificationPanel?: boolean;
  isPinnedOpen: boolean;
  isSearchOpen: boolean;
  onOpenPinnedPanel?: (value: boolean) => void;
  setIsPinnedOpen?: (value: boolean) => void;
  setIsSearchOpen?: (value: boolean) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedOptions: string[];
  setSelectedOptions: (value: string[]) => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  setIsNotificationPanel,
  isNotificationPanel,
  onOpenPinnedPanel,
  setIsPinnedOpen,
  isPinnedOpen,
  isSearchOpen,
  setIsSearchOpen,
  searchTerm,
  setSearchTerm,
  selectedOptions,
  setSelectedOptions,
}) => {
  const { user, signOut } = useAuth();
  const [dropdown, setDropdown] = useState(false);
  const [searchOptions, setSearchOptions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  // const [searchHistory, setSearchHistory] = useState<string[]>(["filter: Shitcoin Alpha", "Test Search text"]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [selectedSource, setSelectedSource] = useState("All sources");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // useEffect(()=>{
  //   if(searchTerm.length>0){
  //     setIsSearchOpen(!isSearchOpen)
  //   }
  // },[searchTerm])
  // const options = [
  //   "from: a user",
  //   "mentions: a user or channel",
  //   "from: a channel or user",
  //   "filter: a channel or user",
  //   "to-do: a task or reminder",
  //   "favourite: a message or task"
  // ];

  const options = [
    { value: "from_user", filters: ["user"], label: "From: a user" },
    { value: "from_group", filters: ["group"], label: "From: a group" },
    { value: "from_channel", filters: ["channel"], label: "From: a channel" },
    {
      value: "mentions_user_channel",
      filters: ["user", "channel"],
      label: "Mentions",
    },
    {
      value: "filter_channel_or_user",
      filters: ["user", "channel"],
      label: "Filter: a channel or user",
    },
    {
      value: "todo_task",
      filters: ["todo_task"],
      label: "To-do: a task or reminder",
    },
    {
      value: "favourite_message_or_task",
      filters: ["favourite_message_or_task"],
      label: "Favourite: a message or task",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // const handleAddOption = (option: string) => {
  //   if (!selectedOptions.includes(option)) {
  //     setSelectedOptions([...selectedOptions, option]);
  //   }
  // };

  // const handleToggleOption = (option: string) => {
  //   if (selectedOptions.includes(option)) {
  //     setSelectedOptions(selectedOptions.filter(o => o !== option));
  //   } else {
  //     setSelectedOptions([...selectedOptions, option]);
  //   }
  // };

  const handleToggleOption = (value: string) => {
    if (selectedOptions.includes(value)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== value));
    } else {
      setSelectedOptions([...selectedOptions, value]);
    }
  };

  const handleAddToSearch = (historyItem: string) => {
    setSearchTerm(historyItem);
    setDropdown(false);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <header className="flex items-center justify-between mr-6 ml-3 py-4">
      <div className="flex items-center gap-3">
        {/* <p className="font-montserrat text-[#5389ff] font-[600] text-[24px] tracking-[1px]">Pigeon</p> */}
        {/* Logo and Title */}
        {/* <svg
          width="77"
          height="30"
          viewBox="0 0 77 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.666992 5.92469H9.78864C11.117 5.92469 12.2683 6.0686 13.2425 6.35641C14.2166 6.64423 15.0247 7.0612 15.6668 7.60732C16.3088 8.14606 16.7849 8.80657 17.0948 9.58884C17.4122 10.3711 17.5708 11.253 17.5708 12.2346C17.5708 13.1571 17.4158 14.0094 17.1059 14.7917C16.7959 15.574 16.3199 16.253 15.6779 16.8286C15.0432 17.3969 14.2388 17.8433 13.2646 18.1681C12.2905 18.4854 11.1392 18.6441 9.81078 18.6441L4.17617 18.633V23.227H0.666992V5.92469ZM9.8772 15.5998C10.5414 15.5998 11.1207 15.5223 11.6152 15.3674C12.117 15.205 12.534 14.9799 12.8661 14.6921C13.2056 14.3969 13.4565 14.0427 13.6188 13.6294C13.7886 13.2087 13.8735 12.7438 13.8735 12.2346C13.8735 11.2087 13.5377 10.4117 12.8661 9.84345C12.2019 9.26781 11.2056 8.98 9.8772 8.98H4.17617V15.5998H9.8772Z"
            fill="#3474FF"
          />
          <path
            d="M22.7294 8.38222C22.4047 8.38222 22.1095 8.33794 21.8438 8.24938C21.5855 8.15344 21.3641 8.02798 21.1796 7.873C20.9951 7.71064 20.8512 7.52614 20.7479 7.3195C20.652 7.10548 20.604 6.88039 20.604 6.64423C20.604 6.40069 20.652 6.17561 20.7479 5.96897C20.8512 5.75495 20.9951 5.57045 21.1796 5.41547C21.3641 5.26049 21.5855 5.13872 21.8438 5.05016C22.1095 4.95422 22.4047 4.90625 22.7294 4.90625C23.0615 4.90625 23.3567 4.95422 23.615 5.05016C23.8807 5.13872 24.1058 5.26049 24.2903 5.41547C24.4748 5.57045 24.615 5.75495 24.7109 5.96897C24.8143 6.17561 24.8659 6.40069 24.8659 6.64423C24.8659 6.88039 24.8143 7.10548 24.7109 7.3195C24.615 7.52614 24.4748 7.71064 24.2903 7.873C24.1058 8.02798 23.8807 8.15344 23.615 8.24938C23.3567 8.33794 23.0615 8.38222 22.7294 8.38222ZM21.0911 10.1645H24.3678V23.227H21.0911V10.1645Z"
            fill="#3474FF"
          />
          <path
            d="M28.5744 10.1645H31.8511V11.2715C32.7219 10.777 33.5522 10.4302 34.3418 10.2309C35.1389 10.0316 35.9174 9.93201 36.6776 9.93201C37.6739 9.93201 38.5964 10.0796 39.4451 10.3748C40.2938 10.6626 41.0281 11.0944 41.648 11.67C42.2679 12.2456 42.7513 12.9652 43.0982 13.8286C43.4524 14.6847 43.6295 15.6773 43.6295 16.8065V23.227H40.3639V17.3378C40.3639 16.622 40.2606 15.9836 40.0539 15.4227C39.8547 14.8545 39.5631 14.3784 39.1794 13.9947C38.803 13.6035 38.3418 13.3084 37.7956 13.1091C37.2569 12.9025 36.6517 12.7991 35.9802 12.7991C35.6259 12.7991 35.2606 12.836 34.8842 12.9098C34.5152 12.9836 34.1499 13.0906 33.7883 13.2309C33.4341 13.3637 33.0909 13.5334 32.7588 13.7401C32.4267 13.9393 32.1241 14.1681 31.8511 14.4264V23.227H28.5744V10.1645Z"
            fill="#3474FF"
          />
          <path
            d="M49.7069 25.441C50.1202 25.5886 50.5409 25.7104 50.9689 25.8063C51.3969 25.9097 51.8102 25.9908 52.2087 26.0499C52.6146 26.1163 53.0021 26.1606 53.3711 26.1827C53.7401 26.2122 54.0685 26.227 54.3563 26.227C55.2271 26.227 55.9836 26.12 56.6256 25.906C57.2751 25.6993 57.8138 25.4189 58.2419 25.0646C58.6773 24.7104 59.002 24.2971 59.216 23.8248C59.43 23.3599 59.537 22.8654 59.537 22.3414V21.7769C59.2566 21.9688 58.9282 22.1532 58.5518 22.3304C58.1754 22.5075 57.7622 22.6625 57.312 22.7953C56.8618 22.9281 56.3821 23.0352 55.8729 23.1163C55.371 23.1975 54.8508 23.2381 54.312 23.2381C53.2419 23.2381 52.253 23.0794 51.3453 22.7621C50.4375 22.4374 49.6516 21.9872 48.9874 21.4116C48.3232 20.8285 47.8029 20.1311 47.4265 19.3193C47.0575 18.5075 46.873 17.6072 46.873 16.6183C46.873 15.6072 47.0686 14.6921 47.4597 13.8729C47.8509 13.0464 48.3896 12.3416 49.0759 11.7586C49.7696 11.1755 50.5888 10.7254 51.5335 10.408C52.4781 10.0907 53.5039 9.93201 54.6109 9.93201C55.0832 9.93201 55.5519 9.96153 56.0168 10.0206C56.4817 10.0796 56.9245 10.1608 57.3452 10.2641C57.7732 10.3674 58.1717 10.4929 58.5407 10.6405C58.9171 10.7807 59.2492 10.9357 59.537 11.1054V10.1645H62.8138V21.7326C62.8138 22.9208 62.6329 23.9724 62.2713 24.8875C61.9097 25.8026 61.3783 26.5702 60.6772 27.1901C59.9835 27.8174 59.1201 28.2897 58.0869 28.607C57.0537 28.9318 55.8692 29.0941 54.5334 29.0941C54.0537 29.0941 53.5556 29.072 53.039 29.0277C52.5224 28.9908 52.0021 28.9318 51.4781 28.8506C50.9615 28.7768 50.4486 28.6845 49.9394 28.5738C49.4375 28.4705 48.9542 28.3487 48.4892 28.2085L49.7069 25.441ZM50.3158 16.5851C50.3158 17.109 50.4191 17.6035 50.6257 18.0684C50.8397 18.526 51.1423 18.9282 51.5335 19.2751C51.9246 19.6145 52.3969 19.8839 52.9504 20.0832C53.5039 20.275 54.1275 20.371 54.8212 20.371C55.2714 20.371 55.7179 20.3304 56.1607 20.2492C56.6109 20.1607 57.0389 20.0389 57.4448 19.8839C57.8581 19.7289 58.2419 19.5407 58.5961 19.3193C58.9577 19.0979 59.2714 18.8507 59.537 18.5777V14.2714C59.2049 14.0058 58.8544 13.7807 58.4854 13.5962C58.1164 13.4117 57.74 13.2604 57.3563 13.1423C56.9725 13.0242 56.5851 12.9394 56.1939 12.8877C55.8028 12.8287 55.4227 12.7991 55.0537 12.7991C54.301 12.7991 53.6294 12.8988 53.039 13.098C52.456 13.2973 51.9615 13.5703 51.5556 13.9172C51.1571 14.2567 50.8508 14.6552 50.6368 15.1128C50.4228 15.5703 50.3158 16.0611 50.3158 16.5851Z"
            fill="#3474FF"
          />
          <path
            d="M66.5443 10.1645H69.821V12.0464C70.5443 11.5076 71.3081 11.0427 72.1125 10.6516C72.9169 10.2604 73.7177 9.96153 74.5147 9.75489L75.4778 12.7549C74.2158 12.8803 73.1051 13.1644 72.1457 13.6072C71.1937 14.0427 70.4188 14.6589 69.821 15.4559V23.227H66.5443V10.1645Z"
            fill="#3474FF"
          />
          <path
            d="M0.666992 5.92469H9.78864C11.117 5.92469 12.2683 6.0686 13.2425 6.35641C14.2166 6.64423 15.0247 7.0612 15.6668 7.60732C16.3088 8.14606 16.7849 8.80657 17.0948 9.58884C17.4122 10.3711 17.5708 11.253 17.5708 12.2346C17.5708 13.1571 17.4158 14.0094 17.1059 14.7917C16.7959 15.574 16.3199 16.253 15.6779 16.8286C15.0432 17.3969 14.2388 17.8433 13.2646 18.1681C12.2905 18.4854 11.1392 18.6441 9.81078 18.6441L4.17617 18.633V23.227H0.666992V5.92469ZM9.8772 15.5998C10.5414 15.5998 11.1207 15.5223 11.6152 15.3674C12.117 15.205 12.534 14.9799 12.8661 14.6921C13.2056 14.3969 13.4565 14.0427 13.6188 13.6294C13.7886 13.2087 13.8735 12.7438 13.8735 12.2346C13.8735 11.2087 13.5377 10.4117 12.8661 9.84345C12.2019 9.26781 11.2056 8.98 9.8772 8.98H4.17617V15.5998H9.8772Z"
            stroke="#3474FF"
          />
          <path
            d="M22.7294 8.38222C22.4047 8.38222 22.1095 8.33794 21.8438 8.24938C21.5855 8.15344 21.3641 8.02798 21.1796 7.873C20.9951 7.71064 20.8512 7.52614 20.7479 7.3195C20.652 7.10548 20.604 6.88039 20.604 6.64423C20.604 6.40069 20.652 6.17561 20.7479 5.96897C20.8512 5.75495 20.9951 5.57045 21.1796 5.41547C21.3641 5.26049 21.5855 5.13872 21.8438 5.05016C22.1095 4.95422 22.4047 4.90625 22.7294 4.90625C23.0615 4.90625 23.3567 4.95422 23.615 5.05016C23.8807 5.13872 24.1058 5.26049 24.2903 5.41547C24.4748 5.57045 24.615 5.75495 24.7109 5.96897C24.8143 6.17561 24.8659 6.40069 24.8659 6.64423C24.8659 6.88039 24.8143 7.10548 24.7109 7.3195C24.615 7.52614 24.4748 7.71064 24.2903 7.873C24.1058 8.02798 23.8807 8.15344 23.615 8.24938C23.3567 8.33794 23.0615 8.38222 22.7294 8.38222ZM21.0911 10.1645H24.3678V23.227H21.0911V10.1645Z"
            stroke="#3474FF"
          />
          <path
            d="M28.5744 10.1645H31.8511V11.2715C32.7219 10.777 33.5522 10.4302 34.3418 10.2309C35.1389 10.0316 35.9174 9.93201 36.6776 9.93201C37.6739 9.93201 38.5964 10.0796 39.4451 10.3748C40.2938 10.6626 41.0281 11.0944 41.648 11.67C42.2679 12.2456 42.7513 12.9652 43.0982 13.8286C43.4524 14.6847 43.6295 15.6773 43.6295 16.8065V23.227H40.3639V17.3378C40.3639 16.622 40.2606 15.9836 40.0539 15.4227C39.8547 14.8545 39.5631 14.3784 39.1794 13.9947C38.803 13.6035 38.3418 13.3084 37.7956 13.1091C37.2569 12.9025 36.6517 12.7991 35.9802 12.7991C35.6259 12.7991 35.2606 12.836 34.8842 12.9098C34.5152 12.9836 34.1499 13.0906 33.7883 13.2309C33.4341 13.3637 33.0909 13.5334 32.7588 13.7401C32.4267 13.9393 32.1241 14.1681 31.8511 14.4264V23.227H28.5744V10.1645Z"
            stroke="#3474FF"
          />
          <path
            d="M49.7069 25.441C50.1202 25.5886 50.5409 25.7104 50.9689 25.8063C51.3969 25.9097 51.8102 25.9908 52.2087 26.0499C52.6146 26.1163 53.0021 26.1606 53.3711 26.1827C53.7401 26.2122 54.0685 26.227 54.3563 26.227C55.2271 26.227 55.9836 26.12 56.6256 25.906C57.2751 25.6993 57.8138 25.4189 58.2419 25.0646C58.6773 24.7104 59.002 24.2971 59.216 23.8248C59.43 23.3599 59.537 22.8654 59.537 22.3414V21.7769C59.2566 21.9688 58.9282 22.1532 58.5518 22.3304C58.1754 22.5075 57.7622 22.6625 57.312 22.7953C56.8618 22.9281 56.3821 23.0352 55.8729 23.1163C55.371 23.1975 54.8508 23.2381 54.312 23.2381C53.2419 23.2381 52.253 23.0794 51.3453 22.7621C50.4375 22.4374 49.6516 21.9872 48.9874 21.4116C48.3232 20.8285 47.8029 20.1311 47.4265 19.3193C47.0575 18.5075 46.873 17.6072 46.873 16.6183C46.873 15.6072 47.0686 14.6921 47.4597 13.8729C47.8509 13.0464 48.3896 12.3416 49.0759 11.7586C49.7696 11.1755 50.5888 10.7254 51.5335 10.408C52.4781 10.0907 53.5039 9.93201 54.6109 9.93201C55.0832 9.93201 55.5519 9.96153 56.0168 10.0206C56.4817 10.0796 56.9245 10.1608 57.3452 10.2641C57.7732 10.3674 58.1717 10.4929 58.5407 10.6405C58.9171 10.7807 59.2492 10.9357 59.537 11.1054V10.1645H62.8138V21.7326C62.8138 22.9208 62.6329 23.9724 62.2713 24.8875C61.9097 25.8026 61.3783 26.5702 60.6772 27.1901C59.9835 27.8174 59.1201 28.2897 58.0869 28.607C57.0537 28.9318 55.8692 29.0941 54.5334 29.0941C54.0537 29.0941 53.5556 29.072 53.039 29.0277C52.5224 28.9908 52.0021 28.9318 51.4781 28.8506C50.9615 28.7768 50.4486 28.6845 49.9394 28.5738C49.4375 28.4705 48.9542 28.3487 48.4892 28.2085L49.7069 25.441ZM50.3158 16.5851C50.3158 17.109 50.4191 17.6035 50.6257 18.0684C50.8397 18.526 51.1423 18.9282 51.5335 19.2751C51.9246 19.6145 52.3969 19.8839 52.9504 20.0832C53.5039 20.275 54.1275 20.371 54.8212 20.371C55.2714 20.371 55.7179 20.3304 56.1607 20.2492C56.6109 20.1607 57.0389 20.0389 57.4448 19.8839C57.8581 19.7289 58.2419 19.5407 58.5961 19.3193C58.9577 19.0979 59.2714 18.8507 59.537 18.5777V14.2714C59.2049 14.0058 58.8544 13.7807 58.4854 13.5962C58.1164 13.4117 57.74 13.2604 57.3563 13.1423C56.9725 13.0242 56.5851 12.9394 56.1939 12.8877C55.8028 12.8287 55.4227 12.7991 55.0537 12.7991C54.301 12.7991 53.6294 12.8988 53.039 13.098C52.456 13.2973 51.9615 13.5703 51.5556 13.9172C51.1571 14.2567 50.8508 14.6552 50.6368 15.1128C50.4228 15.5703 50.3158 16.0611 50.3158 16.5851Z"
            stroke="#3474FF"
          />
          <path
            d="M66.5443 10.1645H69.821V12.0464C70.5443 11.5076 71.3081 11.0427 72.1125 10.6516C72.9169 10.2604 73.7177 9.96153 74.5147 9.75489L75.4778 12.7549C74.2158 12.8803 73.1051 13.1644 72.1457 13.6072C71.1937 14.0427 70.4188 14.6589 69.821 15.4559V23.227H66.5443V10.1645Z"
            stroke="#3474FF"
          />
        </svg> */}
      </div>
      <div className="flex items-center gap-3 relative">
        <div className="relative flex-1 flex items-center bg-[#212121] py-2 px-4 rounded-[12px]">
          <Search className="w-5 h-5 text-[#ffffff48] absolute left-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDropdown(e.target.value !== "");
              setIsSearchOpen(e.target.value !== "");
            }}
            placeholder="Search message"
            className="bg-transparent outline-none text-white flex-1 placeholder:text-[#ffffff48] pl-8 pr-8"
          />
          {searchTerm && (
            <button
              className="absolute right-2 text-[#ffffff48] hover:text-white"
              onClick={() => {
                setSearchTerm("");
                setIsSearchOpen(false);
              }}
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {dropdown && (
          <div
            ref={searchRef}
            className="absolute top-full mt-2 bg-[#212121] rounded-lg shadow-lg w-64 p-4 z-40"
          >
            <div className="">
              <span className="text-[#ffffff80] text-sm">Search Options</span>
              {options.map(({ value, label }) => {
                const isSelected = selectedOptions.includes(value);
                return (
                  <div
                    key={value}
                    className={`mb-1 flex items-center justify-between p-2 rounded cursor-pointer ${
                      isSelected ? "bg-[#5389ff]" : "hover:bg-[#2d2d2d]"
                    }`}
                    onClick={() => handleToggleOption(value)}
                  >
                    <span className="text-white">{label}</span>
                    {isSelected ? (
                      <X
                        className="text-white w-4 h-4 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOptions(
                            selectedOptions.filter((o) => o !== value)
                          );
                        }}
                      />
                    ) : (
                      <Plus className="text-white w-4 h-4" />
                    )}
                  </div>
                );
              })}
            </div>
            {searchHistory.length > 0 && (
              <div className="mt-4">
                <span className="text-[#ffffff80] text-sm">History</span>
                {searchHistory.slice(0, 5).map((historyItem) => (
                  <div
                    key={historyItem}
                    className="flex items-center justify-between p-2 hover:bg-[#2d2d2d] rounded cursor-pointer"
                    onClick={() => handleAddToSearch(historyItem)}
                  >
                    <span className="text-white">{historyItem}</span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between p-2 hover:bg-[#2d2d2d] rounded cursor-pointer"
                  onClick={handleClearHistory}
                >
                  <span className="text-white">Clear History</span>
                  <Trash className="text-white w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )}
        {/* <div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center cursor-pointer">
          <Filter className="h-4 w-4 fill-[#84afff] text-[#84afff]" />
        </div> */}
        <div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center cursor-pointer">
          <Pin
            className="h-4 w-4 fill-[#84afff] text-[#84afff]"
            onClick={() => setIsPinnedOpen(!isPinnedOpen)}
          />
        </div>
        <div className="p-2 border rounded-[10px] border-[#ffffff09] inline-flex items-center justify-center cursor-pointer">
          <Bell
            className="h-4 w-4 fill-[#84afff] text-[#84afff]"
            onClick={() => setIsNotificationPanel(!isNotificationPanel)}
          />
        </div>
      </div>
    </header>
  );
};
