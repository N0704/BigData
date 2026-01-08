import Layout from "@/components/home/Layout";
import Header from "../components/home/Header";
import { getCategories, getRecommendedClusters, getHotClustersTrending, getFeaturedClustersToday, getNewsByClusterId } from "@/lib/actions/news";
import { getCurrentUser } from "@/lib/auth";

export default async function Home({ searchParams }) {
  const user = await getCurrentUser();
  const categories = await getCategories();
  const clusterId = searchParams?.cluster_id;

  let news;
  if (clusterId) {
    news = await getNewsByClusterId(clusterId);
  } else {
    // Sử dụng hệ thống đề cử dựa trên hành vi đọc
    // Nếu user chưa đăng nhập (user = null), sẽ hiển thị theo hot_score
    // Nếu user đã đăng nhập, sẽ ưu tiên clusters thuộc category ưa thích
    news = await getRecommendedClusters(user?.id || null, 20, 0);
  }
  const clusters = await getHotClustersTrending(30);
  const hotToday = await getFeaturedClustersToday(7);

  return (
    <div>
      <Header user={user} />
      <Layout
        user={user}
        categories={categories}
        news={news}
        clusters={clusters}
        hotToday={hotToday}
      />
    </div>
  );
}
