import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SearchInput from '../task/search/SearchInput'

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}
const queryClient = new QueryClient();
export default function Home() {
 
  return (
    <QueryClientProvider client={queryClient}>
    <div className="App">
      <h1>Product Search</h1>
      <SearchInput />
    </div>
    </QueryClientProvider>
  )
}
