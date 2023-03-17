# Admin UI

Options:

- Fluent UI
- MUI styled like Fluent UI / Azure / Microsoft

Decision: MUI:

Tried a spike for Fluent UI:

- Docs direct React consumers to v9
- Tried v9, found:
  - Has no layout components or examples
  - Theming was terrible. Theme provider doesn't set anything on the document, so you need to access the theme and do that yourself
  - There is no nav component
  - There is no breadcrumb component
  - I realised much of the missing stuff from v9 is included in v8, even though v9 is two years old and the doc directs users to it
- Tried switching to v8, found:
  - It is better than v9 in terms of having more of the expected components
  - Is quite old, theming support is poor compared with MUI but better than v8, still flashes on-load if you attempt to initialise matching the users preferred dark mode. The theme isn't available to consumer components like it is with MUI, instead need to randomly import sass variables but those won't match your runtime theme if you're trying to support light and dark mode

The stats are telling as to the state of the v9 effort, and to the state of the ecosystem compared with MUI.

[see usage comparision of options](https://npmtrends.com/@fluentui/react-vs-@fluentui/react-components-vs-@material-ui/core-vs-@mui/base)

To avoid committing this platform's admin UI to the fate of what seems to be a failing / dead React UI framework, decision is to use MUI v5 and theme it.

- We know MUI theming is comprehensive and will support custom styling
- We know the component library is extensive, has excellent documentation & examples, is customisable and we are experienced with it
