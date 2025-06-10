import '../styles.css';
import { OnboardingRender } from '../renders/onboarding.render';
import { UserService } from '../services/user.service';

export async function OnboardingPage(): void {
	const language_obj = await UserService.GetLanguageFile();
	OnboardingRender.render(language_obj);
}
