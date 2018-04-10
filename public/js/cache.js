function clickBtn(id) {
  $.ajax({
    url: "/getImage",
    type: "GET",
    data: "id=" + id.toString(),
    success: function(res) {
      var json = JSON.parse(res);
      console.log(json);
      $("#imageSource").html(json.txt);
      $("#theImage").attr("src", json.img);
    }
  });
}