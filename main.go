package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gobuffalo/packr/v2"
)

func main() {
	r := gin.Default()
	t, err := loadTemplate()
	if err != nil {
		panic(err)
	}
	r.SetHTMLTemplate(t)

	box := packr.NewBox("./dist/assets/")
	//映射静态资源文件
	r.LoadHTMLGlob("dist/*.html")
	//r.Static("/pikpak/assets", "./dist/assets/")
	r.StaticFS("/pikpak/assets", box)
	//router.LoadHTMLFiles("templates/template1.html", "templates/template2.html")
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": "Main website",
		})
	})
	r.Run(":8080") // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}

// 自定义模板加载
func loadTemplate() (*template.Template, error) {
	t := template.New("")
	box := packr.New("Templates Box", "./dist/*.html")
	// fmt.Printf("%v\n", box)
	for _, path := range box.List() {
		fmt.Println(path)
		s, err := box.FindString(path)
		if err != nil {
			log.Fatal(err)
			return nil, err
		}
		t, err = t.New(path).Parse(s)
		if err != nil {
			log.Fatal(err)
			return nil, err
		}
	}
	return t, nil
}
