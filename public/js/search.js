export async function searchTours(searchValue) {
  try {
    // const res = await fetch(`/api/v1/tours?search=${searchValue}`);
    // const data = await res.json();
    // if (data.status === 'success') {
    //   console.log(data.data);
    // }
    location.assign(`/search?search=${searchValue}`);
  } catch (err) {
    console.log(err);
  }
}
