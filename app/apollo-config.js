export default (context) => {
  return {
    httpEndpoint: 'https://devapi.aidacrm.ru/graphql',
    tokenName: 'apollo-token',
    defaultOptions: {
      // See 'apollo' definition
      // For example: default query options
      $query: {
        loadingKey: 'loading',
        fetchPolicy: 'cache-and-network',
      },
    },
    websocketsOnly: false
    /*
     * For permanent authentication provide `getAuth` function.
     * The string returned will be used in all requests as authorization header
     */
    // getAuth: () => 'Bearer my-static-token',
  }
}
