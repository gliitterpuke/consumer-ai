interface PersonalityData {
    name: string;
    avatar: string;
    personality: string;
    backstory: string;
    responseStyle: string;
    responseFrequency: number;
    responseSpeed: number;
    chattiness: number;
    empathy: number;
    relationships?: string[];
    createdBy?: string;
    createdAt?: string;
}
interface RandomPersonalityPool {
    names: string[];
    avatars: string[];
    personalityTraits: string[];
    backstories: string[];
    responseStyles: string[];
}
interface APIResponse {
    success: boolean;
    personality?: PersonalityData;
    message: string;
    aiId?: string;
    error?: string;
}
declare class PersonalityCreator {
    private selectedOption;
    private currentPersonality;
    private randomPersonalities;
    constructor();
    private initializeEventListeners;
    private setupSlider;
    private selectOption;
    private generateRandomPersonalityPool;
    private generateRandomPersonality;
    private updateRandomPreview;
    private updatePreview;
    private createPersonality;
    private showSuccessMessage;
}
//# sourceMappingURL=personality-creator.d.ts.map