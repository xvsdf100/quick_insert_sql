/**
 * 一个sql多张表处理，针对整体处理
 */
 const fs = require('fs')
 var sql_path = 'd:/t3.sql'
 var sava_sql_path = 'd:/batch.sql'
 const max_sql_len = 1024*1000   //mysql单个最大包1m，怕其他字节占用，我就用1000 比 1024小一些
 var global_sort_table_name = []        //全局表名，用来按照顺序插入
 
 //读取mysql文件
 function read_mysql_file(path){
     let data = fs.readFileSync(path)
     if(data.length > 0){
         data = data.toString()
     }
     return data
 }
 
 //基本解析
 //返回对应的数据
 /**
  * 
  * @param {string} data 
  * @returns 
  */
 function parse(data){
     let line_insert_key = 'INSERT INTO'
     let arrya = data.split('\n')
     let new_inert_sql = []
     var m = new Map();
     arrya.forEach(element => {
         if(element.indexOf(line_insert_key) != -1){
             let real_data = get_insert_sql_value(element)
             if(real_data){
                 if(m.has(real_data.table_name)){
                    let array = m.get(real_data.table_name)
                    array.push(real_data.data)
                 }else{
                    let  array = []
                    array.push(real_data.data)
                    global_sort_table_name.push(real_data.table_name)
                    m.set(real_data.table_name, array)
                 }
             }
         }
     });

     return m
 }
 
 /**
  * 获取插入的sql的语句
  * @param {String} inert_sql 
  */
 function get_insert_sql_value(insert_sql){
     let begin_key = 'VALUES ('
     let end_key = ');'
     let start_pos = insert_sql.indexOf(begin_key)
     let end_pos = insert_sql.indexOf(end_key)

     if(start_pos > 0 && end_pos > start_pos){
         start_pos = start_pos+begin_key.length
         let len = end_pos - start_pos
         
         let insert_right_value = insert_sql.substr(start_pos, len)
         let insert_left_value = insert_sql.substr(0, start_pos - 1)
         let table_name = get_insert_table_name(insert_left_value)

         return {
             table_name: table_name,
             data: insert_right_value
         }
     }
     return null
 }

 //获取插入的表
 function get_insert_table_name(insert_left_value){
    let begin_key = 'INSERT INTO `'
    let end_key = '` VALUES'

    if(insert_left_value && insert_left_value.indexOf('INSERT INTO') >= 0){
        let start_pos = insert_left_value.indexOf(begin_key)
        let end_pos = insert_left_value.indexOf(end_key)
        if(start_pos >= 0 && end_pos > start_pos){
            start_pos = start_pos + begin_key.length
            let len = end_pos - start_pos
            let table_name = insert_left_value.substr(start_pos, len)
            return table_name
        }
    }
    return ""
 }
 
 //创建新的插入数组
 /**
  * 
  * @param {Map} data 
  * @returns 
  */
 function create_new_insert_array(data){
    var data_array
     const template = "INSERT INTO `[表名]` VALUES"
     let current_insert_sql = []
     var new_insert_sql = template
 
     for(let ele of global_sort_table_name){
        data_array = data.get(ele)
        new_insert_sql = template
        let insert_comment = '-- ----------------------------\n'
        insert_comment += '-- ' + 'Records of ' + ele + '\n'
        insert_comment += '-- ----------------------------\n'
        new_insert_sql = insert_comment + new_insert_sql
        new_insert_sql = new_insert_sql.replace('[表名]',ele)
        

        for(let index = 0; index < data_array.length; index++){
            new_insert_sql += '(' + data_array[index]
            new_insert_sql += ')'
            if(new_insert_sql.length + 500 >= max_sql_len || (index+1 == data_array.length)){
                new_insert_sql+= ";"
                current_insert_sql.push(new_insert_sql)
                new_insert_sql = template
                new_insert_sql = new_insert_sql.replace('[表名]',ele)
            }else{
                new_insert_sql += ','
            }
        }
     }
 
     return current_insert_sql
 }
 
 /**
  * 解析完成sql对象
  * 新的文件路径
  * @param {*} sql_object 
  * @param {*} new_file_path 
  */
 function create(data_array, new_file_path){
     let new_data_string = ""
     data_array.forEach(element=>{
         new_data_string += element
         new_data_string += '\n'
     })
     fs.writeFileSync(new_file_path,new_data_string)
 }
 
 function init(){
     console.log("请设置自己原始sql路径和生成sql路径")
     let data = read_mysql_file(sql_path)
     let r = parse(data)
     let data_array = create_new_insert_array(r)
     create(data_array, sava_sql_path)
     console.log('生成' + sava_sql_path + ' 成功')
 }
 
 init()
 
