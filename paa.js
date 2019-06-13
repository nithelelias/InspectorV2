
Inspector.add("PaaItemList", function (view) { 

    
    this.item=view.attributes.getNamedItem("item").value;  


});

Inspector.add("Paa", function (view) { 
    window.$paa=this;
    this.name="I AM PAA";
    this.list=["carro","moto","avion","tren"];
    this.getList=function(){
        return this.list.map((item)=>{
            return `<li com='PaaItemList' item="${item}" >{{this.item}}</li>`; 
        }).join("");
    }
});
