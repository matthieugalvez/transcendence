import '../styles.css';
import { OnboardingRender } from '../renders/onboarding.render';
import { UserService } from '../services/user.service';

export function OnboardingPage(): void {
	UserService.GetLanguageFile();
	OnboardingRender.render();
}
