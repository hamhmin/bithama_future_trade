export default async function Page() {
  const response = await fetch(`http://localhost:4000/future`);
  const jsonData = await response.json();
  const msg = jsonData.message;
  //   console.log(msg);
  return (
    <>
      <div>future 페이지입니다.</div>
      <div>{msg}</div>
    </>
  );
}
