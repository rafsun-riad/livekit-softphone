# New Feature Plan Building Prompt

Act as a senior software architect and implementation planner.

## Current progression and app state

In the attached files there is a file for plan of the project. Another file is implemented so far and another is remaining implementations. In the remaining implementations most of the things are manual tests. Which will be done time to time.

1. The main plan file that is used to build this app. [Plan File](./docs/ANDROID_SOFTPHONE_IMPLEMENTATION_PLAN.md)
2. The implementations so far file. [Completed Implementations](./docs/IMPLEMENTATION_SO_FAR.md)
3. Remaining implementations and test file. [Remaining Implementations and Test](./docs/REMAINING_IMPLEMENTATION.md)

## Feature descriptions

I want to build it like a complete communication app like whatsapp. But There should be still room left for portaone and asterisk sip connection from the original plan in the backend.

### Home screen now should be messaging screen

- In the current implementations nothing is done in the app's Top App Bar / Toolbar / Navigation Bar+/ Action bar.
- After user login currently showing Home tab with lots of informations. But currently we don't need that anymore. 
- Current home tab should be replace by messaging. In the top app bar left side it should show messages and in the right side it should show profile small avatar. When click on that user should navigate to current profile page.
- Below the top bar there should be a search bar for searching the conversations contacts name wise. just like whatsapp.
- Below search bar there should load all the conversations. When click on the conversations it should goto like a messaging panel like whatsapp.
- The messaging should support -> Text messaging, Image/Video Messaging, Voice messaging.
- All the messages should be end to end encrypted. Find a suitable way to do this.
- In the conversations list screen below right side there should be a floating button for starting a new conversation. When that button is clicked the contacts list should appear and user will select the contact to start the conversation just like whatsapp.
- Messaging notification/ push notification should work like whatsapp notification.

_Follow whatsapp messaging system for above requirements. Take idea to fulfill our requirements._


### Calls Screen New

- Second tab should be Calls list. 
- In the above bar/app bar in the left side it should show calls and in the right side it should be the avatar.
- Below the app bar there should be a search bar to search a call.
- Below search bar it should show all the calls just like the whatsapp.
- In the call screen right side below there should be a floating button to initiate a new call. When the button is clicked the contact list should show and user can select an contact to initiate call.


_Call related most of the setup is completed already follow the main plan and architecture to grasp of the current application flow and change what is need to be change to meet current requirements._

### Contact Screen

- Third tab should be Contact List.
- In the app top bar left side it should show Contacts and right side it should show user avatar.
- Here contact list should just show like whatsapp contact list. The contacts that is already saved in the phone contacts list if any contact from that saved contact list in the phone using our app that should appear in the contact list just like whatsapp.
- From the user can see a contacts details, can message and can initiate a call.
- Contact list pages below right side there should be floating button to create a new contact. When click on the button new contact adding screen should appear.
- New contact adding system should be like whatsapp. When adding a contact after giving a phone number fully there should be a check that this user using our app or not. Like whatsapp then user Gives name and saved that to contacts.
- There should also be a switch to let user deicde that the newly added contact should sync with phone main contacts or not. 
- If A user call B user. A has added B user in the contacts list as a result he is able to call B user. But B user doesn't have A user contact added in the contacts list. So in the B user messaging panel it should show the A user to save the contact or block the contact. If saved then A user contact should appear in the B user contact list. This should feel like just like the whatsapp.
- There should also be a blocking and unblocking options for the contacts.

_Follow whatsapp system for this and take idea to fulfill our requirements._

**Only above 3 tabs should show in the below nagivation tab list**

## App layouts and design

- Remove unusefull text from the login page. Don't add unneccsary things.
- After splash screen if app takes some time to load or fetch data from the backend then show a loading spinner in the middle of the screen. After loading then the app content should appear.
- Keep current dark like themes, fonts and colors.
- Currently for styles you are using styles sheet. But instead of that use native wind which is taildwindcss for react native. Change whole app design from style sheet to native wind.

## Plan Output

- Plan output should be very specific and comprehensive.
- Use mermaid graph where necessary.
- Ask questions about the ambguity and when need a clarification.
- Every feature must be implemented and don't leave any feature untouch.
- Plan must include how to fulfill the requirements step by step implementation guide about the new features.
- Provide real code example where necessary and don't use pseudocode.
- Also I want to maintain another 3 files for all the feature list. That is proposed feature list, implemented so far, and remaining implementations. with the plan attached to them.
- Also these features implementation is not starting from the ground there is already an app structure, architecture and feature implemented. So understand that very well so that our core functionality don't break.
- When Planing complete tell user to change to Agent mode so that the plan can be save, review and additional files can be created. 