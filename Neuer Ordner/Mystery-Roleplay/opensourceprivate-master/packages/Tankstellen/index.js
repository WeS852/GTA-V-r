require('./tankstellen.js');

mp.events.add("server:tankstellen:openTanke",(player,id) => {
    gm.mysql.handle.query("SELECT * FROM tankstellen WHERE id = ?",[id],function (err,res) {
        if (err) console.log("Error in Select Tanken: "+err);
        if (res.length > 0) {
            var i = 1;
            let TankList = [];          
            res.forEach(function(tanke) {
                let obj = {"bprice": String(tanke.bprice), "dprice": String(tanke.dprice),"sprice": String(tanke.sprice), "id": String(tanke.id)};
                TankList.push(obj);                
                if (parseInt(i) == parseInt(res.length)) {
                    //player.data.mainmenu = true;
                    if(mp.players.exists(player)) player.call("client:tankstellen:drawMenu", [JSON.stringify(TankList)]);
                }
                i++;
            });
        } 
    });
});


mp.events.add("server:tankstellen:tanken",(player,id,value) => {
    if (mp.players.exists(player)) {
        gm.mysql.handle.query("SELECT money FROM characters WHERE id = ?", [player.data.charId], function(err5,res5) {
            if (err5) console.log("eroor im tanken: "+err5);
            gm.mysql.handle.query("SELECT * FROM tankstellen WHERE id = ?",[id],function(err,res) {
                if (err) console.log("Error in Select tankstellen: "+err);
                tanke = res[0];
                const pos = new mp.Vector3(tanke.posX, tanke.posY, tanke.posZ);
                const veh = getVehicleFromPosition(pos, 15)[0];
                if (mp.vehicles.exists(veh)) {
                    if (veh === null) {
                        player.notify("~r~Kein Fahrzeug an der Tankstelle");
                        return;
                    }
                    if (veh.engine === true) {
                        player.notify("~r~Der Motor muss ausgeschaltet sein!");
                        return;
                    }
                    var fuelart = veh.getVariable("fuelart");
                    var fuel = veh.getVariable("fuel");
                    var vehId = veh.getVariable("vehId");
                    var aufgefüllt = parseFloat( parseFloat(100*1).toFixed(2) - parseFloat(fuel*1).toFixed(2) ).toFixed(2);   
                    if (res[0].benzin > aufgefüllt) {
                        var time = aufgefüllt * 3;
                        time = parseInt(time);
                        var timeout = 3000*aufgefüllt;
                        timeout = parseInt(timeout);
                        player.call('progress:start', [time, "Tanke: "+value]);
                        veh.setVariable("tanken","true");
                        setTimeout(function() {
                            if (mp.players.exists(player)) {  
                                if (mp.vehicles.exists(veh)) {  
                                    veh.setVariable("tanken","false");
                                    if (value == "Benzin") {
                                        var price = 1.48;
                                    } else if (value == "Diesel") {
                                        var price = 1.26;
                                    } else if (value == "Strom") {
                                        var price = 3.37;
                                    }             
                                        if (value == fuelart) {                                           
                                            var total = parseFloat(aufgefüllt * price).toFixed(2);
                                            if (res5[0].money > total) {
                                                var newAm = parseFloat(player.data.money - parseFloat(total)).toFixed(2);
                                                veh.setVariable("fuel",100);
                                                gm.mysql.handle.query("UPDATE vehicles SET fill = '100' WHERE id = ?",[vehId],function(err1,res1) {
                                                    if (err1) console.log("Error in Update vehicles Fill: "+err1);
                                                    gm.mysql.handle.query("UPDATE characters SET money = ? WHERE id = ?",[newAm,player.data.charId], function(err2,res2) {
                                                        if (err2) console.log("Error in Update Money: "+err2);
                                                        player.data.money = newAm;
                                                        player.call("changeValue", ['money', player.data.money]); 
                                                        var newFill = parseFloat(res[0].benzin - parseFloat(aufgefüllt)).toFixed(2);
                                                        gm.mysql.handle.query("UPDATE tankstellen SET benzin = ? WHERE id = ?",[newFill,id], function (err3,res3) {
                                                            if (err3) console.log("Error in Update tankstellen Fill: "+err3);
                                                            player.notify("~g~Du hast dein Fahrzeug betankt für: "+total+"$");
                                                        });                                 
                                                    });
                                                }); 
                                            } else {
                                                gm.mysql.handle.query("UPDATE vehicles SET fill = '100' WHERE id = ?",[vehId],function(err1,res1) {
                                                    if (err1) console.log("Error in Update vehicles Fill: "+err1);
                                                    var newFill = parseFloat(res[0].benzin - parseFloat(aufgefüllt)).toFixed(2);
                                                    gm.mysql.handle.query("UPDATE tankstellen SET benzin = ? WHERE id = ?",[newFill,id], function (err3,res3) {
                                                        if (err3) console.log("Error in Update tankstellen Fill: "+err3);
                                                        player.notify("~r~Du hast nicht genügend Geld es wurde ein Notruf abgesetzt!");
                                                        veh.setVariable("fuel",100);
                                                    });                                
                                                });                            
                                            }                    
                                        } else {
                                            var total = parseFloat(aufgefüllt * price);
                                            if (res5[0].money > total) {                            
                                                var newAm = parseFloat(player.data.money - parseFloat(total)).toFixed(2);
                                                veh.setVariable("fuel",100);
                                                gm.mysql.handle.query("UPDATE vehicles SET fill = '100', dead = 'true' WHERE id = ?",[vehId],function(err1,res1) {
                                                    if (err1) console.log("Error in Update vehicles Fill: "+err1);
                                                    gm.mysql.handle.query("UPDATE characters SET money = ? WHERE id = ?",[newAm,player.data.charId], function(err2,res2) {
                                                        if (err2) console.log("Error in Update Money: "+err2);
                                                        player.data.money = newAm;
                                                        player.call("changeValue", ['money', player.data.money]); 
                                                        var newFill = parseFloat(res[0].benzin - parseFloat(aufgefüllt)).toFixed(2);
                                                        gm.mysql.handle.query("UPDATE tankstellen SET benzin = ? WHERE id = ?",[newFill,id], function (err3,res3) {
                                                            if (err3) console.log("Error in Update tankstellen Fill: "+err3);
                                                            player.notify("~g~Du hast dein Fahrzeug betankt für: "+total+"$");
                                                            veh.setVariable("fuel",100);
                                                            veh.setVariable("isDead",true);
                                                            veh.setVariable("isRunning","false");
                                                            veh.engine = false;
                                                            veh.dead = true;
                                                        });                                 
                                                    });
                                                });
                                            } else {
                                                gm.mysql.handle.query("UPDATE vehicles SET fill = '100', dead = 'true' WHERE id = ?",[vehId],function(err1,res1) {
                                                    if (err1) console.log("Error in Update vehicles Fill: "+err1);
                                                    var newFill = parseFloat(res[0].benzin - parseFloat(aufgefüllt)).toFixed(2);
                                                    gm.mysql.handle.query("UPDATE tankstellen SET benzin = ? WHERE id = ?",[newFill,id], function (err3,res3) {
                                                        if (err3) console.log("Error in Update tankstellen Fill: "+err3);
                                                        player.notify("~r~Du hast nicht genügend Geld es wurde ein Notruf abgesetzt!");
                                                        veh.setVariable("fuel",100);
                                                        veh.dead = true;
                                                        veh.setVariable("isDead",true);
                                                        veh.setVariable("isRunning","false");
                                                        veh.engine = false;
                                                    });                                
                                                });                            
                                            }
                                        }
                                }
                            }                    
                            }, timeout);
                    } else {
                        player.notify("~r~Hier ist nicht mehr genügend "+value+" drinne")
                    }      
                }
            });    
        });
    }    
});

function getVehicleFromPosition(position, range) {
    const returnVehicles = [];

    mp.vehicles.forEachInRange(position, range,
        (vehicle) => {
            returnVehicles.push(vehicle);
        }
    );
    return returnVehicles;
}