import Explorer from "./components/Explorer";
import { ChakraProvider } from "@chakra-ui/react";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const client = new ApolloClient({
  uri: "http://localhost:8000/subgraphs/name/get-protocol-subgraph",
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <ChakraProvider>
        <Explorer />
      </ChakraProvider>
    </ApolloProvider>
  );
}

export default App;
