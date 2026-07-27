export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc'
    },
    modal: {
      variants: {
        fullscreen: {
          false: {
            content: 'w-[calc(100vw-2rem)] max-w-2xl test rounded-lg shadow-lg ring ring-default'
          }
        }
      }
    }
  }
})
