import Layout from "@/components/home/Layout";
import Header from "../components/home/Header";
import { getCategories, getHotClusters, getHotClustersTrending, getFeaturedClustersToday, getNewsByClusterId } from "@/lib/actions/news";

export default async function Home({ searchParams }) {
  const categories = await getCategories();
  const clusterId = searchParams?.cluster_id;

  let news;
  if (clusterId) {
    news = await getNewsByClusterId(clusterId);
  } else {
    news = await getHotClusters(20, 0);
  }
  const clusters = await getHotClustersTrending(10);
  const hotToday = await getFeaturedClustersToday(7);

  return (
    <div>
      <Header />
      <Layout
        categories={categories}
        news={news}
        clusters={clusters}
        hotToday={hotToday}
      />
    </div>
  );
}
