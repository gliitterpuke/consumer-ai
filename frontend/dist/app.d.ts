interface Message {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: string;
    isAI?: boolean;
}
interface Community {
    id: string;
    name: string;
    icon: string;
    members: Member[];
    messages: Message[];
}
interface Member {
    id: string;
    name: string;
    avatar: string;
    isAI?: boolean;
}
interface AIPersonality {
    name: string;
    avatar: string;
    personality: string;
    backstory: string;
    responseStyle: string;
    relationships?: string[];
}
interface DMMessage {
    id: string;
    content: string;
    timestamp: string;
    isUser: boolean;
}
interface TypingIndicator {
    userId: string;
    username: string;
}
declare class AICommunities {
    private currentCommunity;
    private username;
    private userId;
    private lastMessageCount;
    private typingUsers;
    private dmHistories;
    private currentDMUser;
    private currentView;
    private readonly avatarMap;
    constructor();
    private initializeEventListeners;
    private initializeProfileAndDM;
    private showUsernameModal;
    private setUsername;
    private loadCommunity;
    private updateUI;
    private attachMemberClickListeners;
    private loadMessages;
    private displayMessages;
    private formatTimestamp;
    private sendMessage;
    private startMessagePolling;
    private checkForNewMessages;
    private checkTypingIndicators;
    private updateTypingIndicators;
    private switchCommunity;
    private showProfile;
    private openDM;
    private closeDM;
    private getMemberName;
    private loadDMMessages;
    private displayDMMessages;
    private displayDMMessagesInMain;
    private sendDMMessage;
    private showDMTyping;
    private generateDMResponse;
    private sendDMMessageInMain;
    private showDMTypingInMain;
    private generateDMResponseInMain;
}
//# sourceMappingURL=app.d.ts.map